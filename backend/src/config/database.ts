import { Pool as PgPool, PoolClient, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parse PostgreSQL int8/BIGINT and COUNT(*) as numbers
types.setTypeParser(20, (val: string) => parseInt(val, 10));

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
  connectionString?: string;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

function parseDatabaseUrl(raw: string): Partial<ParsedDatabaseTarget> | null {
  try {
    const url = new URL(raw);
    if (!url.hostname) return null;
    const database = url.pathname.replace(/^\//, '') || undefined;
    const sslMode = (url.searchParams.get('sslmode') || url.searchParams.get('ssl-mode') || url.searchParams.get('ssl') || '').toLowerCase();
    const sslEnabled =
      sslMode === 'require' ||
      sslMode === 'required' ||
      sslMode === 'true' ||
      sslMode === 'verify-full' ||
      sslMode === 'verify-ca';
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : undefined,
      user: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      database,
      sslEnabled: sslEnabled || true, // Cloud providers (Supabase) require SSL
      connectionString: raw,
    };
  } catch {
    return null;
  }
}

export function getDatabaseTarget(): ParsedDatabaseTarget {
  const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_URL || process.env.MYSQL_URL;
  const fromUrl = rawUrl ? parseDatabaseUrl(stripQuotes(rawUrl)) : null;

  const host = process.env.DB_HOST || fromUrl?.host || 'localhost';
  const isRemoteHost = host !== 'localhost' && host !== '127.0.0.1';
  const sslExplicit = process.env.DB_SSL;
  const sslEnabled =
    sslExplicit === 'true'
      ? true
      : sslExplicit === 'false'
        ? false
        : Boolean(fromUrl?.sslEnabled) || isRemoteHost;

  return {
    host,
    port: parseInt(process.env.DB_PORT || String(fromUrl?.port || 5432), 10),
    user: process.env.DB_USER || fromUrl?.user || 'postgres',
    password: process.env.DB_PASSWORD || fromUrl?.password || '',
    database: process.env.DB_NAME || fromUrl?.database || 'postgres',
    sslEnabled,
    connectionString: fromUrl?.connectionString,
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
    code === '57P01' ||
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
    code === '28P01' ||
    code === '28000' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    combined.includes('password authentication failed') ||
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
  if (code === '3D000' || code === 'ER_BAD_DB_ERROR' || combined.includes('unknown database') || combined.includes('does not exist')) {
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

export function normalizePostgresSql(sql: string): string {
  let transformed = sql;

  // Replace MySQL GROUP_CONCAT with PostgreSQL STRING_AGG
  transformed = transformed.replace(/GROUP_CONCAT\s*\(\s*([^)]+?)\s*\)/gi, "STRING_AGG($1, ',')");

  // Handle ON DUPLICATE KEY UPDATE translations
  if (/ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(transformed)) {
    // Replace VALUES(col) with EXCLUDED.col
    transformed = transformed.replace(/VALUES\s*\(\s*([a-zA-Z0-9_]+)\s*\)/gi, 'EXCLUDED.$1');

    // Replace ON DUPLICATE KEY UPDATE with table-specific ON CONFLICT
    if (/INSERT\s+INTO\s+roles\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (name) DO UPDATE SET');
    } else if (/INSERT\s+INTO\s+user_roles\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE\s+user_id\s*=\s*user_id/i, 'ON CONFLICT (user_id, role_id) DO NOTHING');
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (user_id, role_id) DO NOTHING --');
    } else if (/INSERT\s+INTO\s+users\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (id) DO UPDATE SET');
    } else if (/INSERT\s+INTO\s+categories\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (id) DO UPDATE SET');
    } else if (/INSERT\s+INTO\s+products\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (id) DO UPDATE SET');
    } else if (/INSERT\s+INTO\s+coupons\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (code) DO UPDATE SET');
    } else if (/INSERT\s+INTO\s+orders\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (id) DO UPDATE SET');
    } else if (/INSERT\s+INTO\s+delivery_jobs\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (id) DO UPDATE SET');
    } else if (/INSERT\s+INTO\s+processed_webhooks\b/i.test(transformed)) {
      transformed = transformed.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, 'ON CONFLICT (event_id) DO UPDATE SET');
    }
  }

  // Handle INSERT IGNORE INTO
  if (/INSERT\s+IGNORE\s+INTO\s+user_roles/i.test(transformed)) {
    transformed = transformed.replace(/INSERT\s+IGNORE\s+INTO\s+user_roles/i, 'INSERT INTO user_roles');
    if (!/ON\s+CONFLICT/i.test(transformed)) {
      transformed = `${transformed} ON CONFLICT (user_id, role_id) DO NOTHING`;
    }
  } else if (/INSERT\s+IGNORE\s+INTO\s+wishlists/i.test(transformed)) {
    transformed = transformed.replace(/INSERT\s+IGNORE\s+INTO\s+wishlists/i, 'INSERT INTO wishlists');
    if (!/ON\s+CONFLICT/i.test(transformed)) {
      transformed = `${transformed} ON CONFLICT (user_id, product_id) DO NOTHING`;
    }
  } else {
    transformed = transformed.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  }

  // Convert ? to $1, $2, ... outside single/double quoted literals
  if (transformed.includes('?')) {
    let paramIndex = 1;
    let inString = false;
    let quoteChar = '';
    let result = '';
    for (let i = 0; i < transformed.length; i++) {
      const char = transformed[i];
      if ((char === "'" || char === '"') && transformed[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inString = false;
        }
        result += char;
      } else if (char === '?' && !inString) {
        result += `$${paramIndex++}`;
      } else {
        result += char;
      }
    }
    transformed = result;
  }

  // If inserting into users without returning id, append RETURNING id so caller receives insertId
  if (/^INSERT\s+INTO\s+users\s*\(/i.test(transformed.trim()) && !/RETURNING/i.test(transformed)) {
    transformed = `${transformed} RETURNING id`;
  }

  return transformed;
}

function sanitizeParams(params: any[]): any[] {
  return params.map((p) => {
    if (p === undefined) return null;
    return p;
  });
}

const target = getDatabaseTarget();

const connString = stripQuotes(
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  `postgresql://${encodeURIComponent(target.user)}:${encodeURIComponent(target.password)}@${target.host}:${target.port}/${target.database}`
);

const pgPool = new PgPool({
  connectionString: connString,
  ssl: target.sslEnabled ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '15000', 10),
});

pgPool.on('error', (err) => {
  console.warn('⚠️ Supabase PostgreSQL pool idle client warning:', err.message);
});

export interface CompatibleConnection {
  query: (sql: string, params?: any[]) => Promise<[any[], any]>;
  release: () => void;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

export interface CompatiblePool {
  query: (sql: string, params?: any[]) => Promise<[any[], any]>;
  getConnection: () => Promise<CompatibleConnection>;
  end: () => Promise<void>;
  rawPool: PgPool;
}

export const pool: CompatiblePool = {
  rawPool: pgPool,
  async query(sql: string, params: any[] = []): Promise<[any[], any]> {
    const cleanSql = normalizePostgresSql(sql);
    const cleanParams = sanitizeParams(params);
    const res = await pgPool.query(cleanSql, cleanParams);
    const rows: any = res.rows || [];
    rows.insertId = res.rows[0]?.id;
    rows.affectedRows = res.rowCount;
    return [rows, res.fields];
  },

  async getConnection(): Promise<CompatibleConnection> {
    const client: PoolClient = await pgPool.connect();
    return {
      async query(sql: string, params: any[] = []): Promise<[any[], any]> {
        const cleanSql = normalizePostgresSql(sql);
        const cleanParams = sanitizeParams(params);
        const res = await client.query(cleanSql, cleanParams);
        const rows: any = res.rows || [];
        rows.insertId = res.rows[0]?.id;
        rows.affectedRows = res.rowCount;
        return [rows, res.fields];
      },
      release() {
        client.release();
      },
      async beginTransaction() {
        await client.query('BEGIN');
      },
      async commit() {
        await client.query('COMMIT');
      },
      async rollback() {
        await client.query('ROLLBACK');
      },
    };
  },

  async end() {
    await pgPool.end();
  },
};

export function getPublicDatabaseDiagnostics() {
  return {
    configured: Boolean(target.host),
    ssl: target.sslEnabled,
    provider: 'supabase-postgresql',
  };
}

export default pool;
