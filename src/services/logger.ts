import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const logDir = path.dirname(config.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: config.logErrorFile,
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

export function createModuleLogger(module: string) {
  return {
    info: (message: string, meta?: Record<string, unknown>) =>
      logger.info(message, { module, ...meta }),
    warn: (message: string, meta?: Record<string, unknown>) =>
      logger.warn(message, { module, ...meta }),
    error: (message: string, meta?: Record<string, unknown>) =>
      logger.error(message, { module, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) =>
      logger.debug(message, { module, ...meta }),
  };
}
