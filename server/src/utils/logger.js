import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

// Ensure the logs directory exists
const logDirectory = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console logging in development
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Configure daily log rotation transports
const dailyRotateErrorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDirectory, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
});

const dailyRotateCombinedTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDirectory, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Create the Winston logger instance
const logger = winston.createLogger({
  // Default level based on environment
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  
  // Format for file logs (JSON, complete with timestamps and stack traces)
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Captures stack traces automatically if an Error is passed
    json()
  ),
  
  // Define where the logs should go
  transports: [
    dailyRotateErrorTransport,
    dailyRotateCombinedTransport
  ],
  
  // Do not exit the process if a handled exception gets logged
  exitOnError: false, 
});

// If we are not in production, also log to the Console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    })
  );
}

export default logger;
