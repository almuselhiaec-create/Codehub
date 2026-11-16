import express from 'express';
import { resourceRoutes } from './routes/resourceRoutes.js';
import { categories, levels, types } from './store.js';

const isLoopback = address =>
  ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);

export function createApp({ admin = false, port = 3001, resourceStore } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Proxy headers must never turn a remote caller into a trusted local caller.
  app.set('trust proxy', false);
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    next();
  });

  const allowedOrigins = new Set([
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    'http://127.0.0.1:5173',
    'http://localhost:5173'
  ]);
  const allowedHosts = new Set([
    `127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`
  ]);

  function canAdmin(req) {
    return admin && isLoopback(req.socket.remoteAddress)
      && allowedHosts.has(req.headers.host)
      && !req.headers['x-forwarded-for'] && !req.headers.forwarded;
  }

  function protectWrites(req, res, next) {
    if (!canAdmin(req)) {
      return res.status(403).json({
        error: 'Editing is disabled. Use npm run dev:admin locally.'
      });
    }
    if (!allowedOrigins.has(req.headers.origin)
      || req.get('X-CodeHub-Admin') !== 'local-development') {
      return res.status(403).json({
        error: 'Local admin origin and request header are required.'
      });
    }
    if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) {
      return res.status(415).json({ error: 'Send application/json.' });
    }
    next();
  }

  app.use(express.json({ limit: '32kb' }));
  app.get('/api/config', (req, res) =>
    res.json({ adminEnabled: canAdmin(req), levels, types })
  );
  app.get('/api/categories', (req, res) => res.json(categories));
  app.use('/api/resources', resourceRoutes(protectWrites, resourceStore));
  app.use((req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

  // Express 5 forwards rejected async handlers to this error middleware.
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON request.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request is too large.' });
    }
    console.error('Request failed:', error.message);
    res.status(500).json({
      error: 'Resource storage is unavailable. Please try again later.'
    });
  });
  return app;
}
