import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Use MemoryStorage since we will likely process/upload to Firebase Storage or S3
// Storing locally on disk in a distributed serverless environment (Render) is an anti-pattern.
const storage = multer.memoryStorage();

// Validate MIME types securely
const multerFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Not a supported file type! Please upload only JPG, PNG, or PDF files.'), false);
  }
};

// Configure limits (e.g. prevent large memory spikes)
export const uploadFile = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max size
  }
});

// Exporters for specific use cases
export const uploadAvatar = uploadFile.single('avatar');
export const uploadMedicalRecord = uploadFile.single('recordFile');
export const uploadMultipleDocs = uploadFile.array('documents', 5);
