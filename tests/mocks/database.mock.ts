export const mockDatabaseConnection = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  dropDatabase: jest.fn(),
  clearCollections: jest.fn(),
};

export const mockMongooseModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteMany: jest.fn(),
  save: jest.fn(),
};
