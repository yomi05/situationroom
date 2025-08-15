import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('❌ Please define MONGODB_URI in .env.local');
}

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export default async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // Mongoose v8+ doesn’t need old flags; keeping it clean
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || 'situationroom',
    }).then((m) => {
      console.log('✅ MongoDB Connected');
      return m;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
