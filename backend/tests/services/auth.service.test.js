import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { authService } from '../../src/services/auth.service.js';
import User from '../../src/models/User.js';
import Patient from '../../src/models/Patient.js';
import { tokenService } from '../../src/utils/token.service.js';
import * as sendEmail from '../../src/utils/sendEmail.js';

// Mock dependencies that do side-effects like sending emails
jest.unstable_mockModule('../../src/utils/sendEmail.js', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

describe.skip('Auth Service', () => {
  let sendVerificationEmailMock;

  beforeAll(async () => {
    // Dynamic import to get the mocked module
    const emailModule = await import('../../src/utils/sendEmail.js');
    sendVerificationEmailMock = emailModule.sendVerificationEmail;
    
    // Mock tokenService to simplify token generation for tests
    jest.spyOn(tokenService, 'createTokenPair').mockResolvedValue({
      accessToken: 'fake-access-token',
      refreshToken: 'fake-refresh-token'
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should register a new patient user', async () => {
    const userData = {
      name: 'Test Patient',
      email: 'patient@example.com',
      password: 'password123456',
      phone: '9876543210',
      role: 'patient',
      age: 30,
      contact: '9998887776'
    };

    const result = await authService.registerUser(userData);

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(userData.email);
    expect(result.tokens.accessToken).toBe('fake-access-token');

    // Check if User was created in DB
    const dbUser = await User.findOne({ email: userData.email });
    expect(dbUser).not.toBeNull();
    
    // Check if Patient document was created
    const dbPatient = await Patient.findOne({ user: dbUser._id });
    expect(dbPatient).not.toBeNull();
    expect(dbPatient.emergencyContacts[0].phone).toBe('9998887776');
  });

  it('should throw error if email already exists', async () => {
    const userData = {
      name: 'Test Duplicate',
      email: 'patient@example.com', // same email as above
      password: 'password123456',
      phone: '1111111111',
      role: 'patient'
    };

    await expect(authService.registerUser(userData)).rejects.toThrow('User with this email or phone number already exists');
  });
});
