// lib/redis.ts
import Redis from 'ioredis';

let redis: Redis;

const getRedisClient = (): Redis => {
  if (!redis) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is not defined in environment variables');
    }
    console.log('Connecting to Redis...');
    redis = new Redis(process.env.REDIS_URL, {
    });

    redis.on('connect', () => {
      console.log('Successfully connected to Redis!');
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
      // Potentially re-throw or handle more gracefully in a real app
      // For this example, we'll let ioredis handle retries based on its default strategy or config
    });
  }
  return redis;
};

export default getRedisClient;