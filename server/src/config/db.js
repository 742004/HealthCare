import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    try {
      const conn = await mongoose.connect(mongoUri, {
        maxPoolSize: 50,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000, 
        socketTimeoutMS: 45000, 
      });
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (initialError) {
      logger.warn(`Failed to connect to ${mongoUri}. Starting mongodb-memory-server...`);
      
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(inMemoryUri, {
        maxPoolSize: 50,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000, 
        socketTimeoutMS: 45000, 
      });
      logger.info(`In-Memory MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    logger.error(`Fatal error connecting to MongoDB: ${error.message}. Continuing without DB...`);
  }
};

export default connectDB;
