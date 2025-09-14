import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

function parseWhitelist(str: string | undefined): string[] {
  if (!str) return [];
  return str.split(',').map((s) => s.trim());
}

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  env: process.env.NODE_ENV || 'development',
  corsWhitelist: parseWhitelist(process.env.CORS_ORIGIN_WHITELIST),
  mongoUri: process.env.MONGODB_URI || '',
  mongoDbName: process.env.MONGO_DB_NAME || '',
};

export function getAppVersion(): string {
  try {
    // Try both dev (src) and prod (dist) locations
    const devPath = path.resolve(__dirname, '../../package.json');
    const prodPath = path.resolve(__dirname, '../package.json');
    let pkg;
    if (fs.existsSync(devPath)) {
      pkg = JSON.parse(fs.readFileSync(devPath, 'utf-8'));
    } else if (fs.existsSync(prodPath)) {
      pkg = JSON.parse(fs.readFileSync(prodPath, 'utf-8'));
    }
    return (pkg && pkg.version) || process.env.npm_package_version || 'unknown';
  } catch {
    return process.env.npm_package_version || 'unknown';
  }
}
