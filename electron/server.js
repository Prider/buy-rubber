const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const startServer = async () => {
  const dev = false; // Always production in packaged app
  const hostname = 'localhost';
  const port = 3000;

  // Create Next.js app
  const app = next({ dev, hostname, port, dir: process.cwd() });
  const handle = app.getRequestHandler();

  await app.prepare();

  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`> Ready on http://${hostname}:${port}`);
        resolve(port);
      }
    });
  });
};

module.exports = startServer;

