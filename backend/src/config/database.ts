import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-business-suite';
    
    const options = {
      autoIndex: process.env.NODE_ENV !== 'production',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    };

    await mongoose.connect(mongoURI, options);
    
    logger.info('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

// import mongoose from 'mongoose';

// export const connectDB = async (): Promise<void> => {
//   try {
//     const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-business-suite';
    
//     const options = {
//       autoIndex: process.env.NODE_ENV !== 'production',
//       maxPoolSize: 10,
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000,
//       bufferCommands: false
//     };

//     await mongoose.connect(mongoURI, options);
    
//     console.log('✅ MongoDB connected successfully');

//     // Handle connection events
//     mongoose.connection.on('error', (err) => {
//       console.error('❌ MongoDB connection error:', err);
//     });

//     mongoose.connection.on('disconnected', () => {
//       console.warn('⚠️ MongoDB disconnected');
//     });

//     mongoose.connection.on('reconnected', () => {
//       console.log('🔁 MongoDB reconnected');
//     });

//   } catch (error) {
//     console.error('❌ MongoDB connection failed:', error);
//     throw error;
//   }
// };

// export const disconnectDB = async (): Promise<void> => {
//   try {
//     await mongoose.connection.close();
//     console.log('📴 MongoDB disconnected');
//   } catch (error) {
//     console.error('❌ Error disconnecting from MongoDB:', error);
//   }
// };
