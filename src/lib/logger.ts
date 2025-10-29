// Check if we're in server environment
const isServer = typeof window === 'undefined';

// Lazy-load server-side modules only when needed
let fs: any;
let path: any;
let LOG_DIR: string = '';

function getServerModules() {
  if (!isServer) return { fs: null, path: null, LOG_DIR: '' };
  
  // Lazy require - webpack won't analyze this function body
  if (!fs || !path) {
    try {
      // Use eval to prevent webpack from analyzing this
      fs = eval('require')('fs');
      path = eval('require')('path');
      LOG_DIR = path.join(process.cwd(), 'logs');
    } catch (error) {
      // Ignore errors
    }
  }
  
  return { fs, path, LOG_DIR };
}

// Ensure logs directory exists
function ensureLogDir() {
  if (!isServer) return;
  try {
    const { fs: fsModule, LOG_DIR: dir } = getServerModules();
    if (fsModule && dir && !fsModule.existsSync(dir)) {
      fsModule.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    // Ignore errors in browser
  }
}

// Get log file path for today
function getLogFilePath(level: string = 'app'): string {
  if (!isServer) return '';
  try {
    ensureLogDir();
    const { path: pathModule, LOG_DIR: dir } = getServerModules();
    if (!pathModule || !dir) return '';
    const today = new Date().toISOString().split('T')[0];
    return pathModule.join(dir, `${level}-${today}.log`);
  } catch {
    return '';
  }
}

// Format log message
function formatLog(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  return JSON.stringify(logEntry) + '\n';
}

// Log levels
const logLevels = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
} as const;

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: any, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

class FileLogger implements Logger {
  private writeToFile(level: string, message: string, data?: any) {
    if (!isServer) return; // Skip file writing in browser
    
    try {
      const logFile = getLogFilePath('app');
      const { fs: fsModule } = getServerModules();
      if (logFile && fsModule) {
        const logEntry = formatLog(level, message, data);
        fsModule.appendFileSync(logFile, logEntry);
      }
    } catch (error) {
      // Fail silently in browser
      if (isServer) {
        console.error('Failed to write log:', error);
      }
    }
  }

  info(message: string, data?: any) {
    console.log(`[INFO] ${message}`, data || '');
    this.writeToFile('info', message, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data || '');
    this.writeToFile('warn', message, data);
  }

  error(message: string, error?: any, data?: any) {
    console.error(`[ERROR] ${message}`, error || '', data || '');
    
    // Include error details
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    
    this.writeToFile('error', message, { error: errorData, ...data });
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
      this.writeToFile('debug', message, data);
    }
  }
}

// Create logger instance
export const logger = new FileLogger();

// Export for convenience
export const log = logger;

// Helper function to clear old logs (older than 30 days)
export function cleanupOldLogs(daysToKeep: number = 30) {
  if (!isServer) return; // Skip in browser
  
  try {
    ensureLogDir();
    const { fs: fsModule, path: pathModule, LOG_DIR: dir } = getServerModules();
    if (!fsModule || !pathModule || !dir) return;
    
    const files = fsModule.readdirSync(dir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    files.forEach((file: string) => {
      const filePath = pathModule.join(dir, file);
      const stats = fsModule.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fsModule.unlinkSync(filePath);
        logger.info(`Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    if (isServer) {
      logger.error('Failed to cleanup old logs', error);
    }
  }
}

