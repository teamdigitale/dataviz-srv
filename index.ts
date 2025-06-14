import express, { Router } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as middlewares from "./lib/middlewares.ts";
import authRouter from "./routes/auth.ts";
import chartRouter from "./routes/charts.ts";
import dashRouter from "./routes/dashboards.ts";
import suggestionsRouter from "./routes/hints.ts";
import healthRouter from "./routes/health.ts";

// import seedUsers from "./seeds/seed-users.ts";
// import * as db from "./lib/db.ts";

const whitelist = process?.env.DOMAINS?.split(",") || "http://localhost:3000";

const app = express();

// Configurazione CORS più flessibile per sviluppo locale
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? whitelist 
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
  credentials: true,
  methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
};

// Middleware di sicurezza
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Aumentato limite per dashboard con molti dati

// Health checks PRIMA di altri middleware per evitare autenticazione
app.use("/", healthRouter as Router);

// Middleware di autenticazione
app.use(middlewares.checkAuthCookie);

const port = parseInt(process.env.PORT || "3003");

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "dataviz-srv",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      ready: "/api/ready", 
      startup: "/api/startup",
      metrics: "/api/metrics",
      auth: "/auth",
      charts: "/charts",
      dashboards: "/dashboards", 
      hints: "/hints"
    }
  });
});

/* SEED - Decommentare se serve
app.get("/seed", (req, res) => {
  const result = seedUsers();
  res.json({ result });
});
*/

// API Routes
app.use("/auth", authRouter as Router);
app.use("/charts", chartRouter as Router);
app.use("/dashboards", dashRouter as Router);
app.use("/hints", suggestionsRouter as Router);

// Error handling middleware
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Chiudi connessioni database
  try {
    const { prisma } = await import("./lib/db.ts");
    await prisma.$disconnect();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    const { prisma } = await import("./lib/db.ts");
    await prisma.$disconnect();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 DataViz Server listening on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`⚡ Ready check: http://localhost:${port}/ready`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📖 API docs: http://localhost:${port}/`);
  }
});

export default app;