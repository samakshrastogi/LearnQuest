import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: any;
let isRedisMocked = false;

// Mock Redis class for fallback
class MockRedis {
  private store: Record<string, string> = {};
  
  async get(key: string): Promise<string | null> {
    return this.store[key] || null;
  }
  
  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    this.store[key] = value;
    if (mode === 'EX' && duration) {
      setTimeout(() => {
        delete this.store[key];
      }, duration * 1000);
    }
    return 'OK';
  }
  
  async del(key: string): Promise<number> {
    if (this.store[key]) {
      delete this.store[key];
      return 1;
    }
    return 0;
  }

  // Sorted sets mock for leaderboards
  private zSets: Record<string, Record<string, number>> = {};

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.zSets[key]) {
      this.zSets[key] = {};
    }
    this.zSets[key][member] = score;
    return 1;
  }

  async zrevrange(key: string, start: number, stop: number, withScores?: string): Promise<string[]> {
    const set = this.zSets[key] || {};
    const sorted = Object.entries(set).sort((a, b) => b[1] - a[1]);
    const sliced = sorted.slice(start, stop === -1 ? undefined : stop + 1);
    
    if (withScores === 'WITHSCORES') {
      const result: string[] = [];
      for (const [member, score] of sliced) {
        result.push(member, score.toString());
      }
      return result;
    }
    return sliced.map(([member]) => member);
  }

  async quit(): Promise<string> {
    return 'OK';
  }
}

try {
  logger.info(`🔌 Connecting to Redis at ${env.REDIS_URL}...`);
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 2) {
        logger.warn('⚠️ Redis connection timed out. Falling back to In-Memory Cache.');
        isRedisMocked = true;
        redisClient = new MockRedis();
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.on('error', (err: any) => {
    if (!isRedisMocked) {
      logger.warn(`⚠️ Redis Connection Error: ${err.message}. Falling back to In-Memory Cache.`);
      isRedisMocked = true;
      redisClient = new MockRedis();
    }
  });
} catch (error) {
  logger.warn('⚠️ Redis initialization failed. Using In-Memory Cache fallback.');
  isRedisMocked = true;
  redisClient = new MockRedis();
}

export { redisClient, isRedisMocked };
