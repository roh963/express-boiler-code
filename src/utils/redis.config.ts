// src/utils/redis.config.ts
import { config } from './config'; // ensure this file exists
import Redis from 'ioredis';

class RedisConfig {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisConfig.instance) {
      const redisUrl = config.redisUrl;
      if (!redisUrl) throw new Error('REDIS_URL is not defined');

      RedisConfig.instance = new Redis(redisUrl, {
        // Standard ioredis options
        lazyConnect: true,
        connectTimeout: 10000,
        enableReadyCheck: false,
        maxRetriesPerRequest: null, // MUST be null for BullMQ
        // simple reconnect strategy
        retryStrategy: (times: number) => Math.min(times * 100, 2000),
        keepAlive: 10000,
        family: 4,
        reconnectOnError: (err: any) => {
          return err?.message?.includes('READONLY') ?? false;
        },
      });

      // Event listeners
      RedisConfig.instance.on('connect', () => console.log('✅ Redis connected'));
      RedisConfig.instance.on('ready', () => console.log('🔥 Redis ready'));
      RedisConfig.instance.on('error', (err) => console.error('❌ Redis error:', err));
      RedisConfig.instance.on('close', () => console.log('🔌 Redis closed'));
      RedisConfig.instance.on('end', () => console.log('🔌 Redis ended'));
    }

    return RedisConfig.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisConfig.instance) {
      try {
        await RedisConfig.instance.quit();
        console.log('🔌 Redis disconnected gracefully');
        RedisConfig.instance = null;
      } catch (err) {
        console.error('❌ Redis disconnect error:', err);
      }
    }
  }
}

export const redis = RedisConfig.getInstance();
export default RedisConfig;
