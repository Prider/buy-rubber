const express = require('express');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cors = require('cors');

interface ServerModeOptions {
  port: number;
  host: string;
  allowExternalConnections: boolean;
}

class ServerMode {
  private app: any;
  private server: any;
  private nextApp: any;
  private port: number;
  private host: string;
  private allowExternalConnections: boolean;

  constructor(options: ServerModeOptions) {
    this.port = options.port;
    this.host = options.host;
    this.allowExternalConnections = options.allowExternalConnections;
    this.app = express();
  }

  async start(): Promise<void> {
    try {
      // Create Next.js app
      this.nextApp = next({ 
        dev: false, 
        hostname: this.host, 
        port: this.port,
        dir: process.cwd() 
      });
      
      await this.nextApp.prepare();
      const handle = this.nextApp.getRequestHandler();

      // Configure CORS for external connections
      if (this.allowExternalConnections) {
        this.app.use(cors({
          origin: true, // Allow all origins
          credentials: true,
        }));
      }

      // API routes
      this.setupApiRoutes();

      // Handle Next.js requests
      this.app.all('*', (req: any, res: any) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      });

      // Create HTTP server
      this.server = createServer(this.app);

      return new Promise((resolve, reject) => {
        this.server.listen(this.port, this.host, (err: any) => {
          if (err) {
            reject(err);
          } else {
            console.log(`🚀 Server mode started on http://${this.host}:${this.port}`);
            console.log(`📡 External connections: ${this.allowExternalConnections ? 'Enabled' : 'Disabled'}`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Failed to start server mode:', error);
      throw error;
    }
  }

  private setupApiRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (req: any, res: any) => {
      res.json({ 
        status: 'ok', 
        mode: 'server',
        timestamp: new Date().toISOString(),
        port: this.port,
        host: this.host
      });
    });

    // Server info endpoint
    this.app.get('/api/server/info', (req: any, res: any) => {
      res.json({
        mode: 'server',
        port: this.port,
        host: this.host,
        allowExternalConnections: this.allowExternalConnections,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Network info endpoint
    this.app.get('/api/server/network', (req: any, res: any) => {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      const networkInfo: any = {};

      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            networkInfo[name] = {
              address: iface.address,
              port: this.port,
              url: `http://${iface.address}:${this.port}`
            };
          }
        }
      }

      res.json({
        localhost: `http://localhost:${this.port}`,
        network: networkInfo
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 Server mode stopped');
          resolve();
        });
      });
    }
  }

  getInfo() {
    return {
      port: this.port,
      host: this.host,
      allowExternalConnections: this.allowExternalConnections,
      isRunning: !!this.server
    };
  }
}

export default ServerMode;
