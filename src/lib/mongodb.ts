import mongoose from "mongoose";

type Cache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = global as typeof globalThis & { mongo?: Cache };
const cache = globalCache.mongo ?? { connection: null, promise: null };
globalCache.mongo = cache;

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (cache.connection) return cache.connection;
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
  cache.connection = await cache.promise;
  return cache.connection;
}
