import bcrypt from 'bcryptjs';
import pool from '../config/database';

async function seed() {
  try {
    console.log('Starting database seeding...');

    const connection = await pool.getConnection();

    // Insert roles
    console.log('Seeding roles...');
    await connection.query(`
      INSERT INTO roles (name, description) VALUES
      ('admin', 'System administrator with full access'),
      ('buyer', 'Regular buyer who can purchase products'),
      ('seller', 'Approved seller who can list products'),
      ('delivery_man', 'Delivery personnel who handle order deliveries')
      ON DUPLICATE KEY UPDATE name = name
    `);

    // Insert default admin user
    console.log('Seeding admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, is_verified, is_active) VALUES
      ('admin@agrimarket.com', ?, 'Admin', 'User', '+639123456789', true, true)
      ON DUPLICATE KEY UPDATE email = email
    `, [adminPassword]);

    // Get admin user ID
    const [adminUsers] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@agrimarket.com']);
    const adminId = (adminUsers as any)[0].id;

    // Assign admin role
    await connection.query(`
      INSERT INTO user_roles (user_id, role_id) 
      SELECT ?, id FROM roles WHERE name = 'admin'
      ON DUPLICATE KEY UPDATE user_id = user_id
    `, [adminId]);

    // Insert categories
    console.log('Seeding categories...');
    await connection.query(`
      INSERT INTO categories (name, description, is_active, sort_order) VALUES
      ('Vegetables', 'Fresh vegetables from local farms', true, 1),
      ('Fruits', 'Fresh and seasonal fruits', true, 2),
      ('Rice', 'Various rice varieties', true, 3),
      ('Corn', 'Corn and corn products', true, 4),
      ('Grains', 'Various grains and cereals', true, 5),
      ('Livestock', 'Farm animals for meat and dairy', true, 6),
      ('Poultry', 'Chicken, duck, and other poultry', true, 7),
      ('Fish', 'Fresh and processed fish products', true, 8),
      ('Seafood', 'Crabs, shrimp, and other seafood', true, 9),
      ('Seeds', 'Agricultural seeds for planting', true, 10),
      ('Fertilizers', 'Plant fertilizers and soil enhancers', true, 11),
      ('Farm Supplies', 'Tools and supplies for farming', true, 12),
      ('Farm Equipment', 'Machinery and equipment for agriculture', true, 13),
      ('Organic Products', 'Certified organic agricultural products', true, 14),
      ('Processed Agricultural Products', 'Processed goods from agricultural produce', true, 15),
      ('Other', 'Other agricultural products not categorized', true, 16)
      ON DUPLICATE KEY UPDATE name = name
    `);

    // Insert sample coupons
    console.log('Seeding coupons...');
    const now = new Date();
    const validFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await connection.query(`
      INSERT INTO coupons (code, description, discount_type, discount_value, discount_scope, minimum_order_amount, usage_limit, per_user_limit, valid_from, valid_until, is_active) VALUES
      ('FREESHIP', 'Free shipping on all orders', 'fixed', 0, 'shipping', 0, 1000, 1, ?, ?, true),
      ('SAVE50', '₱50 shipping discount', 'fixed', 50, 'shipping', 200, 500, 2, ?, ?, true),
      ('SAVE100', '₱100 shipping discount', 'fixed', 100, 'shipping', 500, 300, 2, ?, ?, true),
      ('WELCOME10', '10% off for new users', 'percentage', 10, 'order', 300, 1000, 1, ?, ?, true)
      ON DUPLICATE KEY UPDATE code = code
    `, [validFrom, validUntil, validFrom, validUntil, validFrom, validUntil, validFrom, validUntil]);

    connection.release();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

export default seed;
