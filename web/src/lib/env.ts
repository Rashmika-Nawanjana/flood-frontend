/**
 * Environment Detection Utility
 * Use this to detect the current environment (development, staging, production)
 */

export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isStaging: process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging',
  isProduction: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production',
  isDevelopment: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' || !process.env.NEXT_PUBLIC_ENVIRONMENT,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
};

/**
 * Get API base URL
 */
export const getApiUrl = (): string => {
  return ENV.apiUrl;
};

/**
 * Check if we're in production
 */
export const isProduction = (): boolean => {
  return ENV.isProd || ENV.isProduction;
};

/**
 * Check if we're in staging
 */
export const isStaging = (): boolean => {
  return ENV.isStaging;
};

/**
 * Log with environment prefix (development only)
 */
export const devLog = (message: string, data?: unknown): void => {
  if (ENV.isDev) {
    console.log(`[${ENV.environment.toUpperCase()}] ${message}`, data || '');
  }
};

/**
 * Error logger (all environments)
 */
export const errorLog = (message: string, error?: unknown): void => {
  console.error(`[ERROR] ${message}`, error || '');
};

export default ENV;
