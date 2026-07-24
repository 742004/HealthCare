import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
// firebaseAdmin utility will be created in the utils folder later
import { verifyFirebaseToken } from '../utils/firebaseAdmin.js'; 

/**
 * Middleware to authenticate requests via custom JWT or Firebase Auth
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Alternatively, check cookies if we implement cookie-based auth
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new ApiError(401, 'You are not logged in! Please log in to get access.'));
    }

    let decodedUserId;

    // 3. Attempt to verify as a custom JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      decodedUserId = decoded.id;
    } catch (jwtError) {
      // 4. If custom JWT fails, attempt to verify as a Firebase ID Token
      try {
        const firebaseDecodedToken = await verifyFirebaseToken(token);
        // We assume Firebase token uses email to link to our DB User
        const userByEmail = await User.findOne({ email: firebaseDecodedToken.email }).select('_id');
        if (!userByEmail) {
          return next(new ApiError(401, 'Firebase user not registered in system.'));
        }
        decodedUserId = userByEmail._id;
      } catch (firebaseError) {
        return next(new ApiError(401, 'Invalid or expired token. Please log in again.'));
      }
    }

    // 5. Check if user still exists in our database
    const currentUser = await User.findById(decodedUserId).select('-password');
    if (!currentUser) {
      return next(new ApiError(401, 'The user belonging to this token no longer exists.'));
    }

    // 6. Check if user was deactivated / soft deleted
    if (currentUser.isActive === false) {
      return next(new ApiError(403, 'This account has been deactivated.'));
    }

    // 7. Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(new ApiError(500, 'Internal Server Error during authentication.'));
  }
};
