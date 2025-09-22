import { Queue, Worker, Job } from 'bullmq';
import { bullmqRedis } from './bullmq-redis.config';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Email queue for background jobs
export const emailQueue = new Queue('email', {
  connection: bullmqRedis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Email job data interface


// Email worker
export const emailWorker = Worker
