import { z } from 'zod';

/**
 * Reusable RegEx patterns
 */
// Strong password: min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,128}$/;

// E.164 Standard for Indian phone numbers: Exactly 10 digits starting with 6,7,8,9
const phoneRegex = /^[6-9]\d{9}$/;

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
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain alphabetic characters and spaces')
      .trim(),
    
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format')
      .toLowerCase()
      .trim(),
      
    password: z
      .string({ required_error: 'Password is required' })
      .regex(passwordRegex, 'Password must be at least 12 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.'),
      
    phone: z
      .string({ required_error: 'Phone number is required' })
      .regex(phoneRegex, 'Invalid phone number format. Please enter a valid 10-digit Indian mobile number.'),
      
    role: z
      .enum(['patient', 'doctor', 'driver', 'hospital', 'admin'])
      .optional()
      .default('patient'),

    // Patient specific fields
    age: z.coerce.number().int().min(0, 'Age cannot be negative').max(120, 'Age cannot exceed 120').optional(),
    blood: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    contact: z.string().optional()
  }).refine((data) => {
    // If role is patient, age and blood are required
    if (data.role === 'patient') {
      return data.age !== undefined && data.blood !== undefined;
    }
    return true;
  }, {
    message: "Age and Blood group are required for patients",
    path: ["role"]
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
      .regex(passwordRegex, 'Password must be at least 12 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.'),
  }),
});
