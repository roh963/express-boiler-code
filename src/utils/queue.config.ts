import { Queue, Worker, Job } from 'bullmq';
import { bullmqRedis } from './bullmq-redis.config'; 

// Email queue for background jobs
export const emailQueue = new Queue('email', {
  connection: bullmqRedis, // पु
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
interface EmailJobData {
  feedbackId: string;
  userEmail?: string;
  feedbackTitle: string;
  feedbackContent: string;
}

// Email worker
export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { feedbackId, userEmail, feedbackTitle, feedbackContent } = job.data;
    
    console.log(`🚀 Processing email job for feedback ${feedbackId}`);
    
    // Simulate email processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`📧 Sending email for feedback ${feedbackId}`);
    console.log(`   Title: ${feedbackTitle}`);
    console.log(`   To: ${userEmail || 'admin@company.com'}`);
    console.log(`   Content preview: ${feedbackContent.substring(0, 50)}...`);
    
    // In real implementation, you would use a service like SendGrid, Nodemailer, etc.
    console.log(`✅ Email sent successfully for feedback ${feedbackId}`);
    
    return { success: true, emailSent: true };
  },
  {
    connection: bullmqRedis, 
    concurrency: 5
  }
);

emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed for feedback ${job.data.feedbackId}`);
});

emailWorker.on('failed', (job, error) => {
  console.error(`❌ Email job ${job?.id} failed:`, error.message);
});