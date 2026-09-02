import { redisClient } from "../lib/redis";

export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!redisClient?.isReady) return null;
  try {
    const value = await redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

export const setCache = async (key: string, value: unknown, ttlSeconds = 60) => {
  if (!redisClient?.isReady) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // Cache is an optimization; request should still succeed.
  }
};

export const clearAssessmentCache = async () => {
  if (!redisClient?.isReady) return;
  try {
    const keys = await redisClient.keys("assessments:*");
    if (keys.length) await redisClient.del(keys);
  } catch {
    // Ignore cache invalidation failures.
  }
};
