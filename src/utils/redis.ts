import Redis from "ioredis";
import config from "../config";

const redis = new Redis(config.redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (err: any) => {
  // Gracefully handle connection errors without crashing the entire process
  if (err.code === 'ECONNREFUSED') {
    console.warn("⚠️ Redis not found at 127.0.0.1:6379. Caching is disabled, but the app will continue to run.");
  } else {
    console.error("Redis connection error:", err);
  }
});

export const setCache = async (key: string, value: any, ttlSeconds: number = 300) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
};

export const getCache = async (key: string) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

export const delCache = async (key: string) => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
  }
};

export default redis;
