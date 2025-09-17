import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

// Connect to the in-memory database before all tests run
beforeAll(async () => {
  // Check if there is an existing connection
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Reusing existing Mongo connection...');
    return;
  }

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);
  console.log('✅ Mongo connected');
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongod) {
    await mongod.stop();
  }
  console.log('✅ Mongo disconnected');
});

// Clean up collections after each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
