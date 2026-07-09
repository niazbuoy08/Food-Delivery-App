import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('\n  MONGO_URI is missing. Copy server/.env.example to server/.env and fill it in.\n');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('\n  MongoDB connection failed:', err.message);
    console.error('  Check MONGO_URI, and that your IP is allowed in Atlas -> Network Access.\n');
    process.exit(1);
  }
}
