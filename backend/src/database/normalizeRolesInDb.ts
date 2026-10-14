import pool from '../config/database';

export async function normalizeRolesInDb() {
  const conn = await pool.getConnection();
  try {
    // 1. Ensure all canonical roles exist alongside legacy alias
    await conn.query(`
      INSERT INTO roles (name, description) VALUES
      ('admin', 'System administrator with full access'),
      ('buyer', 'Regular buyer who can purchase products'),
      ('seller', 'Approved seller who can list products'),
      ('delivery', 'Delivery rider'),
      ('delivery_man', 'Legacy delivery rider alias')
      ON DUPLICATE KEY UPDATE description=VALUES(description)
    `);

    // 2. Assign canonical 'delivery' role to any user currently assigned 'delivery_man'
    await conn.query(`
      INSERT IGNORE INTO user_roles (user_id, role_id)
      SELECT ur.user_id, r_canonical.id
      FROM user_roles ur
      JOIN roles r_legacy ON ur.role_id = r_legacy.id AND r_legacy.name = 'delivery_man'
      JOIN roles r_canonical ON r_canonical.name = 'delivery'
    `);

    const [driverRoles]: any = await conn.query(`
      SELECT u.id, u.email, r.name as role_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'driver@agrimarket.com'
    `);

    console.log('✅ Canonical roles verified and normalized in database.');
    console.log('Driver roles in database:', driverRoles);
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  normalizeRolesInDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to normalize roles in database:', err);
      process.exit(1);
    });
}
