// src/db/index.ts
import mongoose from 'mongoose';

export async function connectDB() {
  if (process.env.NODE_ENV === 'test') {
    return; // Skip Mongo connection in test environment
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  await mongoose.disconnect();
}

// Handle process termination
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  process.exit(0);
});
