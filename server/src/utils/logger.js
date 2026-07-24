import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }), // Automatically log error stacks
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
  ),
  transports: [
    new winston.transports.Console(),
    // Log errors to a dedicated file
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Log everything else to a combined file
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Avoid writing to files in test mode to prevent clutter
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach(t => (t.silent = true));
}

export default logger;
