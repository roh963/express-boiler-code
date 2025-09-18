import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export class TestDatabase {
  private mongod: MongoMemoryServer | null = null;

  async connect(): Promise<void> {
    this.mongod = await MongoMemoryServer.create();
    const uri = this.mongod.getUri();
    await mongoose.connect(uri);
  }

  async cleanup(): Promise<void> {
    if (this.mongod) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      await this.mongod.stop();
    }
  }

  async clearCollections(): Promise<void> {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}
