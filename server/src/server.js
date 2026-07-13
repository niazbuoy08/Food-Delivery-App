import './config/env.js'; // must come first — everything below reads process.env
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB, dbState } from './config/db.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Render (and most PaaS) terminate TLS at a proxy. Without this, req.ip is the
// proxy's address and every visitor shares one rate-limit bucket.
app.set('trust proxy', 1);

app.use(
  helmet({
    // The default CSP is `default-src 'self'`, which would block the Google
    // Fonts stylesheet and the font files it pulls in. Widen it precisely.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    // Lets the browser load our own images normally when embedded.
    crossOriginEmbedderPolicy: false,
  })
);

// In production the React app is served from this same origin, so there is no
// cross-origin request to allow. CORS only matters for the Vite dev server.
if (!isProduction) {
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '100kb' }));

// Reports honestly. If the database is down this returns 503 and says why —
// far more useful than a service that simply never answers.
app.get('/api/health', (_req, res) => {
  const healthy = dbState.connected;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    database: healthy ? 'connected' : 'unavailable',
    ...(healthy ? {} : { reason: dbState.error, hint: 'Check MONGO_URI and Atlas → Network Access (allow 0.0.0.0/0).' }),
    time: new Date(),
  });
});

// Every data route needs the database. Without this they'd hang until Mongoose's
// buffering timeout, which looks like the server is broken rather than the DB.
app.use('/api/(menu|orders|admin)', (_req, res, next) => {
  if (dbState.connected) return next();
  res.status(503).json({
    success: false,
    message: 'The kitchen is offline right now. Please try again in a moment.',
  });
});

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

if (isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');

  // `redirect: false` stops serve-static from 301-ing a request that happens to
  // match a directory name (e.g. /dishes) instead of letting it reach the SPA.
  app.use(express.static(clientDist, { maxAge: '1d', redirect: false }));

  // Any non-API path is a client route (/menu, /admin/orders, /order/BL-XXXXXX).
  // Hand it index.html and let React Router resolve it, so a hard refresh or a
  // shared tracking link doesn't 404.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Bind the port FIRST in production. If we exited on a bad database config
// before listening, the host would see no open port, hold every request open,
// and the only symptom would be a timeout with no error anywhere. Listening
// first means a misconfigured deploy still serves a page and tells you why.
if (isProduction) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`  Server listening on port ${PORT} (production)`);
  });
  attachShutdown(server);

  await connectDB({ exitOnFailure: false });
  if (!dbState.connected) {
    console.error('  Serving in DEGRADED mode — the site loads but data routes return 503.');
    console.error('  Fix the database config, then redeploy. GET /api/health for details.\n');
  }
} else {
  // Locally, fail fast and loudly — you want the mistake in your face.
  await connectDB({ exitOnFailure: true });
  const server = app.listen(PORT, () => {
    console.log(`  Server listening on port ${PORT} (development)`);
  });
  attachShutdown(server);
}

function attachShutdown(server) {
  // Don't leave a half-dead process behind on an unhandled rejection.
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
}
