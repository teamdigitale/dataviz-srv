interface LogEntry {
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  [key: string]: any;
}

class Logger {
  private service: string;
  private version: string;
  private environment: string;
  private logLevel: number;

  constructor() {
    this.service = 'dataviz-srv';
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
    
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.logLevel = levels[process.env.LOG_LEVEL as keyof typeof levels] ?? 
                   (this.environment === 'production' ? 1 : 0);
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= this.logLevel;
  }

  private log(level: LogEntry['level'], message: string, meta: Record<string, any> = {}) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      service: this.service,
      version: this.version,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };

    const spacing = this.environment === 'development' ? 2 : undefined;
    console.log(JSON.stringify(entry, null, spacing));
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | Record<string, any>) {
    const meta = error instanceof Error 
      ? { error_message: error.message, stack: error.stack }
      : error || {};
    this.log('error', message, meta);
  }

  request(req: any, res: any, duration?: number) {
    this.info('HTTP request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration_ms: duration,
      user_id: req.user?.userId,
      ip: req.ip,
      user_agent: req.get('User-Agent')
    });
  }

  httpError(message: string, statusCode: number, req?: any, meta: Record<string, any> = {}) {
    const level = statusCode >= 500 ? 'error' : statusCode === 404 ? 'info' : 'warn';
    
    this.log(level, message, {
      status_code: statusCode,
      method: req?.method,
      url: req?.originalUrl,
      user_id: req?.user?.userId,
      ...meta
    });
  }

  health(endpoint: string, status: 'healthy' | 'unhealthy', checks?: Record<string, any>) {
    const level = status === 'healthy' ? 'info' : 'warn';
    this.log(level, `Health check ${status}`, {
      endpoint,
      status,
      ...checks
    });
  }

  database(operation: string, model: string, duration?: number, error?: Error) {
    if (error) {
      this.error(`Database ${operation} failed`, {
        operation,
        model,
        duration_ms: duration,
        error_message: error.message
      });
    } else {
      this.debug(`Database ${operation}`, {
        operation,
        model,
        duration_ms: duration
      });
    }
  }
}

export const logger = new Logger();