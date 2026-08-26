import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// For production: Create a write stream (in append mode)
const logDirectory = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

// Production Logger - logs to file with comprehensive Apache combined format
export const productionLogger = morgan('combined', { stream: accessLogStream });

// Development Logger - logs to terminal with color coding and concise format
export const developmentLogger = morgan('dev');

// Utility function to inject the right logger based on environment
export const setupLogger = (app) => {
  if (process.env.NODE_ENV === 'production') {
    app.use(productionLogger);
  } else {
    app.use(developmentLogger);
  }
};
