import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { bullmqRedis } from './utils/bullmq-redis.config';
import axios from 'axios';

interface EmailJobData {
  feedbackId: string;
  userEmail?: string;
  feedbackTitle: string;
  feedbackContent: string;
}

console.log('🚀 Worker started...');

const Workers = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { feedbackId, userEmail, feedbackTitle, feedbackContent } = job.data;

    console.log(`📩 Processing webhook job for feedback ${feedbackId}`);

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('WEBHOOK_URL not configured');
    }

    const payload = {
      content: `📢 New Feedback received!\n\n**From:** ${
        userEmail || 'unknown'
      }\n**Title:** ${feedbackTitle}\n**Content:** ${feedbackContent.substring(
        0,
        200,
      )}${feedbackContent.length > 200 ? '...' : ''}`,
    };

    try {
      await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`✅ Webhook sent for feedback ${feedbackId}`);
      return { success: true, webhookSent: true };
    } catch (error: any) {
      console.error(
        `❌ Webhook failed for feedback ${feedbackId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
  {
    connection: bullmqRedis,
    concurrency: 5,
  },
);

Workers.on('completed', (job) => {
  console.log(
    `🎉 Webhook job ${job.id} completed for feedback ${job.data.feedbackId}`,
  );
});

Workers.on('failed', (job, error) => {
  console.error(`❌ Webhook job ${job?.id} failed:`, error.message);
});
