import mongoose from 'mongoose';

// Tracks why the database is unavailable, so /api/health can say so out loud
// instead of the service just hanging.
export const dbState = {
  connected: false,
  error: null,
};

/**
 * Connects to MongoDB.
 *
 * In development, a bad config should stop the process loudly — you want to fix
 * it now. In production, exiting before the HTTP port is bound is the worst
 * possible failure: the host sees nothing listening, holds every request open,
 * and the operator gets a timeout with no explanation. So in production we
 * report the failure, keep serving, and let /api/health explain what is wrong.
 */
export async function connectDB({ exitOnFailure = true } = {}) {
  const uri = process.env.MONGO_URI;

  const fail = (message, hint) => {
    dbState.connected = false;
    dbState.error = message;
    console.error(`\n  MongoDB unavailable: ${message}`);
    if (hint) console.error(`  ${hint}`);
    if (exitOnFailure) process.exit(1);
    return false;
  };

  if (!uri) {
    return fail(
      'MONGO_URI is not set.',
      'Locally: copy server/.env.example to server/.env. On a host: set MONGO_URI in the dashboard.'
    );
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    dbState.connected = true;
    dbState.error = null;
    console.log(`  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    // A cluster that drops later shouldn't leave health lying about it.
    mongoose.connection.on('disconnected', () => {
      dbState.connected = false;
      dbState.error = 'Lost connection to MongoDB.';
    });
    mongoose.connection.on('connected', () => {
      dbState.connected = true;
      dbState.error = null;
    });

    return true;
  } catch (err) {
    return fail(
      err.message,
      'Check MONGO_URI, and that Atlas → Network Access allows 0.0.0.0/0 so your host can connect.'
    );
  }
}
