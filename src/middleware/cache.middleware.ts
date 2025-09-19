import { Request, Response, NextFunction } from 'express';
import { redis } from '../utils/redis.config';

export const cacheMiddleware = (duration: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `cache:${req.originalUrl}`;
      const cachedData = await redis.get(key);

      if (cachedData) {
        console.log(`🎯 Cache HIT for ${key}`);
        res.json(JSON.parse(cachedData));
        return;
      }

      console.log(`💾 Cache MISS for ${key}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = (data: any) => {
        // Cache the response
        redis.setex(key, duration, JSON.stringify(data)).catch(console.error);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};