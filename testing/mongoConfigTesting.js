import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';

export async function initializeMongoServer() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  mongoose.connect(mongoUri);

  mongoose.connection.on('error', (e) => {
    if (e.message.code === 'ETIMEDOUT') {
      
      mongoose.connect(mongoUri);
    }
    
  });
  mongoose.connection.once('open', () => {
    const user = new User({
      username: 'spirolina',
      password: '123456',
    });
    user.save((err, result) => {
      if (err) {
        
        return;
      }
      
    });
    
  });
}

export const cloeServer = () => {
  mongoose.connection.close();
};
