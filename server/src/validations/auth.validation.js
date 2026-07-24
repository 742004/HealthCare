import { z } from 'zod';

/**
 * Reusable RegEx patterns
 */
// Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// E.164 Standard for international phone numbers
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Zod Schema for User Registration
 * Validates request body fields strictly before reaching the controller.
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format')
      .toLowerCase()
      .trim(),
      
    password: z
      .string({ required_error: 'Password is required' })
      .regex(passwordRegex, 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.'),
      
    phone: z
      .string({ required_error: 'Phone number is required' })
      .regex(phoneRegex, 'Invalid phone number format. Please include country code e.g., +1234567890'),
      
    role: z
      .enum(['Patient', 'Doctor', 'Driver', 'HospitalAdmin'])
      .optional()
      .default('Patient'),
  }),
});

/**
 * Zod Schema for User Login
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format')
      .toLowerCase()
      .trim(),
      
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
});

/**
 * Zod Schema for Password Reset
 * Validates both the URL params (token) and request body (new password)
 */
export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string({ required_error: 'Reset token is required in URL parameters' }),
  }),
  body: z.object({
    newPassword: z
      .string({ required_error: 'New password is required' })
      .regex(passwordRegex, 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.'),
  }),
});
