import type { IncomingMessage, ServerResponse } from 'http';
import type { Server } from 'http';
import { recordApiRequest } from '@/lib/apiPerformance';

let patched = false;

export function patchHttpServerForApiPerformance() {
  if (patched || typeof window !== 'undefined') {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const http = require('http') as typeof import('http');
  const serverPrototype = http.Server.prototype as Server & { __apiPerfPatched?: boolean };

  if (serverPrototype.__apiPerfPatched) {
    patched = true;
    return;
  }

  type ServerEmit = (this: Server, event: string, ...args: unknown[]) => boolean;
  const originalEmit = serverPrototype.emit as ServerEmit;

  serverPrototype.emit = function emitWithApiPerformance(
    this: Server,
    event: string,
    ...args: unknown[]
  ) {
    if (event === 'request') {
      const req = args[0] as IncomingMessage;
      const res = args[1] as ServerResponse;

      const rawUrl = req.url || '';
      if (rawUrl.startsWith('/api')) {
        const start = performance.now();

        res.on('finish', () => {
          recordApiRequest({
            method: req.method || 'GET',
            path: rawUrl,
            status: res.statusCode,
            durationMs: performance.now() - start,
          });
        });
      }
    }

    return originalEmit.call(this, event, ...args);
  } as typeof serverPrototype.emit;

  serverPrototype.__apiPerfPatched = true;
  patched = true;
}
