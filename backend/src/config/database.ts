import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export type DatabaseFailureKind =
  | 'dns'
  | 'timeout'
  | 'refused'
  | 'auth'
  | 'tls'
  | 'database_missing'
  | 'unknown';

export interface ParsedDatabaseTarget {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  sslEnabled: boolean;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

function parseDatabaseUrl(raw: string): Partial<ParsedDatabaseTarget> | null {
  try {
    const url = new URL(raw);
    if (!url.hostname) return null;
    const database = url.pathname.replace(/^\//, '') || undefined;
    const sslMode = (url.searchParams.get('ssl-mode') || url.searchParams.get('ssl') || '').toLowerCase();
    const sslEnabled =
      sslMode === 'required' ||
      sslMode === 'true' ||
      sslMode === 'verify_identity' ||
      sslMode === 'verify_ca';
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : undefined,
      user: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      database,
      sslEnabled: sslEnabled || undefined,
    };
  } catch {
    return null;
  }
}

export function getDatabaseTarget(): ParsedDatabaseTarget {
  const fromUrl = process.env.DATABASE_URL || process.env.MYSQL_URL
    ? parseDatabaseUrl(stripQuotes(process.env.DATABASE_URL || process.env.MYSQL_URL || ''))
    : null;

  const host = process.env.DB_HOST || fromUrl?.host || 'localhost';
  const isRemoteHost = host !== 'localhost' && host !== '127.0.0.1';
  const sslExplicit = process.env.DB_SSL;
  const sslEnabled =
    sslExplicit === 'true'
      ? true
      : sslExplicit === 'false'
        ? false
        : Boolean(fromUrl?.sslEnabled) ||
          ((process.env.NODE_ENV || '').toLowerCase() === 'production' && isRemoteHost);

  return {
    host,
    port: parseInt(process.env.DB_PORT || String(fromUrl?.port || 3306), 10),
    user: process.env.DB_USER || fromUrl?.user || 'root',
    password: process.env.DB_PASSWORD || fromUrl?.password || '',
    database: process.env.DB_NAME || fromUrl?.database || 'agrimarket',
    sslEnabled,
  };
}

function buildSslConfig(sslEnabled: boolean) {
  if (!sslEnabled) return undefined;
  const ca = process.env.DB_CA_CERT || process.env.MYSQL_CA_CERT;
  if (ca) {
    return {
      ca: ca.includes('\\n') ? ca.replace(/\\n/g, '\n') : ca,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }
  // Aiven requires TLS. Without a CA bundle, verification must be relaxed or
  // connections fail. Prefer supplying DB_CA_CERT in production.
  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
  };
}

export function classifyDatabaseError(err: unknown): {
  kind: DatabaseFailureKind;
  message: string;
} {
  const anyErr = err as { code?: string; message?: string; sqlMessage?: string };
  const code = String(anyErr?.code || '');
  const msg = String(anyErr?.message || anyErr?.sqlMessage || err || '');
  const combined = `${code} ${msg}`.toLowerCase();

  if (code === 'ENOTFOUND' || combined.includes('enotfound') || combined.includes('getaddrinfo')) {
    return {
      kind: 'dns',
      message:
        'Database hostname could not be resolved (DNS). Confirm DB_HOST or DATABASE_URL matches the current provider hostname.',
    };
  }
  if (
    code === 'ETIMEDOUT' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    combined.includes('timed out') ||
    combined.includes('timeout')
  ) {
    return {
      kind: 'timeout',
      message: 'Database connection timed out. Check network access, port, and provider firewall rules.',
    };
  }
  if (code === 'ECONNREFUSED' || combined.includes('econnrefused')) {
    return {
      kind: 'refused',
      message: 'Database refused the connection. Confirm host, port, and that the instance is running.',
    };
  }
  if (
    code === 'ER_ACCESS_DENIED_ERROR' ||
    combined.includes('access denied') ||
    combined.includes('er_access_denied')
  ) {
    return {
      kind: 'auth',
      message: 'Database authentication failed. Confirm DB_USER and DB_PASSWORD (do not log secrets).',
    };
  }
  if (
    combined.includes('certificate') ||
    combined.includes('ssl') ||
    combined.includes('tls') ||
    code === 'HANDSHAKE_SSL_ERROR'
  ) {
    return {
      kind: 'tls',
      message: 'TLS handshake with the database failed. Confirm DB_SSL and CA certificate settings.',
    };
  }
  if (code === 'ER_BAD_DB_ERROR' || combined.includes('unknown database')) {
    return {
      kind: 'database_missing',
      message: 'The configured database name does not exist. Confirm DB_NAME.',
    };
  }
  return {
    kind: 'unknown',
    message: 'Database connection failed. See server logs for the classified error kind.',
  };
}

const target = getDatabaseTarget();

const pool = mysql.createPool({
  host: target.host,
  port: target.port,
  user: target.user,
  password: target.password,
  database: target.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '15000', 10),
  enableKeepAlive: true,
  ssl: buildSslConfig(target.sslEnabled),
});

export function getPublicDatabaseDiagnostics() {
  return {
    configured: Boolean(target.host),
    ssl: target.sslEnabled,
    // Never include hostname, user, or password in public responses.
  };
}

export default pool;
