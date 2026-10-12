/**
 * Environment-aware persistence policy.
 *
 * Production must use the shared MySQL database. The JSON/embedded store is
 * allowed only in non-production environments so local development can run
 * without Aiven/MySQL.
 */
export function isProductionEnv(): boolean {
  return (process.env.NODE_ENV || '').toLowerCase() === 'production';
}

export function isDatabaseRequired(): boolean {
  const explicit = process.env.DB_REQUIRED;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return isProductionEnv();
}

export function isEmbeddedFallbackAllowed(): boolean {
  if (isProductionEnv()) return false;
  if (process.env.ALLOW_EMBEDDED_STORE === 'false') return false;
  if (isDatabaseRequired()) return false;
  return true;
}

export function databaseUnavailableError(message?: string): Error & {
  statusCode: number;
  code: string;
} {
  const err = new Error(
    message || 'Marketplace data is temporarily unavailable. Please try again shortly.'
  ) as Error & { statusCode: number; code: string };
  err.statusCode = 503;
  err.code = 'DATABASE_UNAVAILABLE';
  return err;
}
