import mongoose from 'mongoose';
import User from '../../src/models/User.js';

describe('User Model Test', () => {
  it('should create and save a user successfully', async () => {
    const validUser = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password12345',
      role: 'patient',
      phone: '+1234567890'
    });
    const savedUser = await validUser.save();
    
    // Object Id should be defined when successfully saved to MongoDB.
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(validUser.name);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.phone).toBe(validUser.phone);
    expect(savedUser.role).toBe(validUser.role);
    
    // Password should be hashed, not raw
    expect(savedUser.password).not.toBe('password12345');
    // Check if comparePassword works
    const isMatch = await savedUser.comparePassword('password12345');
    expect(isMatch).toBe(true);
  });

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({ name: 'Jane Doe' });
    let err;
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.phone).toBeDefined();
  });
});
