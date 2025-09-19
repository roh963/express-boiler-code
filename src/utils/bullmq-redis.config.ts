// src/utils/bullmq-redis.config.ts
import { config } from '../utils/config';
import Redis from 'ioredis';

class BullMQRedisConfig {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!BullMQRedisConfig.instance) {
      const redisUrl = config.redisUrl;
      if (!redisUrl) throw new Error('REDIS_URL is not defined in environment');

      BullMQRedisConfig.instance = new Redis(redisUrl, {
        // BullMQ requirement
        maxRetriesPerRequest: null,
        // connect lazily is fine, or set false and call connect() at startup
        lazyConnect: true,
        connectTimeout: 10000,
        // disable ready check can be useful for some managed Redis setups
        enableReadyCheck: false,
        // provide a retry strategy compatible with ioredis
        retryStrategy: (times: number) => Math.min(times * 100, 2000),
        // set family and keepAlive (keepAlive is top-level in ioredis)
        family: 4,
        keepAlive: 10000,
        // safe reconnectOnError usage
        reconnectOnError: (err: any) => {
          if (!err || !err.message) return false;
          return err.message.includes('READONLY');
        },
      });

      BullMQRedisConfig.instance.on('connect', () => {
        console.log('✅ BullMQ Redis: Connected to server');
      });
      BullMQRedisConfig.instance.on('ready', () => {
        console.log('🔥 BullMQ Redis: Ready for queue operations');
      });
      BullMQRedisConfig.instance.on('error', (error) => {
        console.error('❌ BullMQ Redis: Connection error:', error);
      });
      BullMQRedisConfig.instance.on('close', () => {
        console.log('🔌 BullMQ Redis: Connection closed');
      });
    }
    return BullMQRedisConfig.instance;
  }

  public static async disconnect(): Promise<void> {
    if (BullMQRedisConfig.instance) {
      try {
        await BullMQRedisConfig.instance.quit();
        console.log('🔌 BullMQ Redis: Gracefully disconnected');
        BullMQRedisConfig.instance = null;
      } catch (error) {
        console.error('❌ BullMQ Redis: Error during disconnect:', error);
      }
    }
  }
}

export const bullmqRedis = BullMQRedisConfig.getInstance();
export default BullMQRedisConfig;
