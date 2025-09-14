import mongoose from 'mongoose';
import { config } from '../utils/config';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export async function connectDB() {
  let attempts = 0;
  if (!config.mongoUri) {
    console.error('❌ MONGODB_URI not set in environment');
    process.exit(1);
  }

  while (attempts < MAX_RETRIES) {
    try {
      await mongoose.connect(config.mongoUri, {
        dbName: config.mongoDbName || undefined,
      });
      console.log('✅ Mongo connected');
      break;
    } catch (err) {
      attempts++;
      console.error(`Mongo connection failed (attempt ${attempts}):`, err);
      if (attempts >= MAX_RETRIES) {
        console.error('❌ Could not connect to Mongo after retries. Exiting.');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
    }
  }
}

function handleExit(signal: string) {
  mongoose.disconnect().then(() => {
    console.log('Mongo disconnected gracefully');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));
