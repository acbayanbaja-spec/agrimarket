import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const sslConfig: any = process.env.DB_SSL === 'true' ? {
  // For Aiven MySQL, we need proper SSL configuration
  // Aiven provides SSL certificates, but for development we can use relaxed SSL
  rejectUnauthorized: false, // Only for development - set to true in production with proper CA cert
} : false;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrimarket',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig,
});

export default pool;
