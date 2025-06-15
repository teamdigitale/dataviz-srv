import { logger } from "../lib/logger.js";
import { Router, Request, Response } from "express";
import { prisma } from "../lib/db.js";

const router = Router();

// Basic health check - per liveness probe
router.get("/api/health", async (req: Request, res: Response) => {
  try {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || "1.0.0",
      service: "dataviz-srv"
    };
    
    logger.health('/api/health', 'healthy');
    res.status(200).json(healthData);
  } catch (error) {
    logger.health('/api/health', 'unhealthy', { error });
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Service unavailable"
    });
  }
});

// Readiness check - verifica dipendenze esterne
router.get("/api/ready", async (req: Request, res: Response) => {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    service: "dataviz-srv"
  };

  let allHealthy = true;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 5000);
    });
    
    const dbPromise = prisma.$queryRaw`SELECT 1 as health_check`;
    
    await Promise.race([dbPromise, timeoutPromise]);
    checks.database = true;
  } catch (error) {
    logger.error('Database health check failed', error instanceof Error ? error : { error });
    checks.database = false;
    allHealthy = false;
  }

  const status = allHealthy ? 200 : 503;
  logger.health('/api/ready', allHealthy ? 'healthy' : 'unhealthy', checks);
  
  res.status(status).json({
    status: allHealthy ? "ready" : "not ready",
    checks,
    ...(!allHealthy && { 
      message: "One or more dependencies are not ready" 
    })
  });
});

// Detailed health check con più informazioni
router.get("/health/detailed", async (req: Request, res: Response) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    service: "dataviz-srv",
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    dependencies: {
      database: false,
      external_services: {
        resend: process.env.RESEND_API_KEY ? "configured" : "not configured",
        openai: process.env.OPENAI_API_KEY ? "configured" : "not configured"
      }
    },
    database_info: {}
  };

  let allHealthy = true;

  try {
    // Test database connection
    const dbResult = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        version() as database_version,
        current_user as database_user,
        inet_server_addr() as server_addr
    ` as any[];
    
    health.dependencies.database = true;
    if (dbResult && dbResult[0]) {
      health.database_info = {
        name: dbResult[0].database_name,
        version: dbResult[0].database_version?.split(' ')[0] || 'unknown',
        user: dbResult[0].database_user,
        server: dbResult[0].server_addr || 'localhost'
      };
    }

    // Test database tables
    const tableCount = await prisma.$queryRaw`
      SELECT count(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[];
    
    health.database_info.tables = parseInt(tableCount[0]?.table_count || '0');

  } catch (error) {
    console.error('Database detailed check failed:', error);
    health.dependencies.database = false;
    health.database_info = { error: 'Connection failed' };
    allHealthy = false;
  }

  if (!allHealthy) {
    health.status = "degraded";
  }

  const status = allHealthy ? 200 : 503;
  res.status(status).json(health);
});

// Startup probe - verifica che l'app sia completamente inizializzata
router.get("/api/startup", async (req: Request, res: Response) => {
  try {
    // Verifica che Prisma sia inizializzato
    await prisma.$connect();
    
    // Verifica che le tabelle principali esistano
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Chart', 'Dashboard')
    ` as any[];

    if (tables.length < 3) {
      throw new Error('Required tables not found');
    }

    res.status(200).json({
      status: "started",
      timestamp: new Date().toISOString(),
      message: "Application fully initialized",
      tables_found: tables.length
    });
  } catch (error) {
    res.status(503).json({
      status: "starting",
      timestamp: new Date().toISOString(),
      error: "Application still initializing"
    });
  }
});

// Metrics endpoint per Prometheus
router.get("/api/metrics", async (req: Request, res: Response) => {
  try {
    let dbStatus = 0;
    let userCount = 0;
    let chartCount = 0;
    let dashboardCount = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 1;
      
      // Conta records principali
      userCount = await prisma.user.count();
      chartCount = await prisma.chart.count();
      dashboardCount = await prisma.dashboard.count();
    } catch (error) {
      console.error('Metrics DB query failed:', error);
    }

    const metrics = `
# HELP dataviz_uptime_seconds Application uptime in seconds
# TYPE dataviz_uptime_seconds counter
dataviz_uptime_seconds ${Math.floor(process.uptime())}

# HELP dataviz_memory_usage_bytes Memory usage in bytes
# TYPE dataviz_memory_usage_bytes gauge
dataviz_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}
dataviz_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}
dataviz_memory_usage_bytes{type="external"} ${process.memoryUsage().external}
dataviz_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}

# HELP dataviz_database_status Database connection status (1=connected, 0=disconnected)
# TYPE dataviz_database_status gauge
dataviz_database_status ${dbStatus}

# HELP dataviz_users_total Total number of users
# TYPE dataviz_users_total gauge
dataviz_users_total ${userCount}

# HELP dataviz_charts_total Total number of charts
# TYPE dataviz_charts_total gauge
dataviz_charts_total ${chartCount}

# HELP dataviz_dashboards_total Total number of dashboards
# TYPE dataviz_dashboards_total gauge
dataviz_dashboards_total ${dashboardCount}

# HELP dataviz_build_info Build information
# TYPE dataviz_build_info gauge  
dataviz_build_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}",service="dataviz-srv"} 1
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics.trim());
  } catch (error) {
    res.status(500).set('Content-Type', 'text/plain').send('# Error generating metrics');
  }
});

export default router;