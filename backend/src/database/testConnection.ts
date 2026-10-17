import pool, { getDatabaseTarget } from '../config/database';

async function testConnection() {
  try {
    const target = getDatabaseTarget();
    console.log('Testing Supabase PostgreSQL connection...');
    console.log('Host:', target.host);
    console.log('Port:', target.port);
    console.log('Database:', target.database);
    console.log('User:', target.user);
    console.log('SSL:', target.sslEnabled);

    const connection = await pool.getConnection();
    console.log('✅ Supabase PostgreSQL connection successful!');

    const [rows] = await connection.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('Server query result:', rows[0]);

    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log('Users in database:', users[0]?.count);

    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log('Products in database:', products[0]?.count);

    const [orders] = await connection.query('SELECT COUNT(*) as count FROM orders');
    console.log('Orders in database:', orders[0]?.count);

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
