// Application configuration and mode management
export interface AppConfig {
  mode: 'server' | 'client';
  serverUrl?: string;
  serverPort?: number;
  clientPort?: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  allowExternalConnections: boolean;
}

export interface ClientConfig {
  serverUrl: string;
  reconnectAttempts: number;
  reconnectInterval: number;
}

// Default configurations
export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  port: 3001,
  host: '0.0.0.0', // Allow external connections
  allowExternalConnections: true,
};

export const DEFAULT_CLIENT_CONFIG: ClientConfig = {
  serverUrl: 'http://localhost:3001',
  reconnectAttempts: 5,
  reconnectInterval: 3000,
};

// Configuration storage keys
export const CONFIG_KEYS = {
  APP_MODE: 'app_mode',
  SERVER_URL: 'server_url',
  SERVER_PORT: 'server_port',
  CLIENT_PORT: 'client_port',
} as const;

// Mode detection utilities
export const isServerMode = (mode: string): boolean => mode === 'server';
export const isClientMode = (mode: string): boolean => mode === 'client';

// Network utilities
export const getLocalIPAddress = (): string => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

export const validateServerUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const formatServerUrl = (host: string, port: number): string => {
  return `http://${host}:${port}`;
};
