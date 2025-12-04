/* eslint-disable @typescript-eslint/no-require-imports */
// Check if we're in server environment
const isServer = typeof window === 'undefined';

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
// In serverless, file system is read-only except for /tmp, so we skip file logging
const isServerless = isServer && (
  process.env.VERCEL === '1' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
  process.env.VERCEL_ENV !== undefined ||
  process.env.NEXT_RUNTIME === 'nodejs' && process.env.VERCEL === '1'
);

// Lazy-load server-side modules
let fs: any;
let path: any;
let LOG_DIR: string = '';

function getServerModules() {
  if (!isServer || isServerless) return { fs: null, path: null, LOG_DIR: '' };
  
  // Load modules on first use
  if (!fs || !path) {
    try {
      // Use require directly - only runs in Node.js runtime
      fs = require('fs');
      path = require('path');
      
      // Try to get Electron userData path if available
      try {
        const electron = require('electron');
        const app = electron?.app || electron?.remote?.app;
        if (app?.getPath) {
          const userData = app.getPath('userData');
          LOG_DIR = path.join(userData, 'logs');
        }
      } catch {
        // Not in Electron
      }
      
      if (!LOG_DIR) {
        // Use project logs directory for Next.js development
        LOG_DIR = path.join(process.cwd(), 'logs');
      }
    } catch (_error) {
      // Silently fail - logger won't work but app will continue
    }
  }
  
  return { fs, path, LOG_DIR };
}

// Ensure logs directory exists
function ensureLogDir() {
  if (!isServer || isServerless) return;
  try {
    const { fs: fsModule, LOG_DIR: dir } = getServerModules();
    if (fsModule && dir && !fsModule.existsSync(dir)) {
      fsModule.mkdirSync(dir, { recursive: true });
    }
  } catch (_error) {
    // Ignore errors in browser or serverless
  }
}

// Get log file path for today
function getLogFilePath(level: string = 'app'): string {
  if (!isServer || isServerless) return '';
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

// Log levels (exported for potential future use)
export const logLevels = {
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
    // Skip file writing in browser or serverless environments
    if (!isServer || isServerless) return;
    
    try {
      const logFile = getLogFilePath('app');
      const { fs: fsModule } = getServerModules();
      if (logFile && fsModule) {
        const logEntry = formatLog(level, message, data);
        fsModule.appendFileSync(logFile, logEntry);
      }
    } catch (error) {
      // Fail silently in browser or serverless
      // Only log errors in non-serverless server environments
      if (isServer && !isServerless) {
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
  // Skip in browser or serverless environments
  if (!isServer || isServerless) return;
  
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
    if (isServer && !isServerless) {
      logger.error('Failed to cleanup old logs', error);
    }
  }
}

