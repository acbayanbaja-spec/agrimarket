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
      ('delivery', 'Delivery rider'),
      ('delivery_man', 'Delivery personnel who handle order deliveries')
      ON DUPLICATE KEY UPDATE description=VALUES(description)
    `);

    // Insert admin user (guard against predictable default password in production)
    console.log('Seeding admin user...');
    if (process.env.NODE_ENV === 'production' && !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
      console.warn('⚠️ Skipping default admin seed in production: Use bootstrapAdmin script with BOOTSTRAP_ADMIN_PASSWORD.');
    } else {
      const adminSecret = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin123';
      const adminPassword = await bcrypt.hash(adminSecret, 12);
      await connection.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, is_verified, is_active) VALUES
        (?, ?, 'Admin', 'User', '+639123456789', true, true)
        ON DUPLICATE KEY UPDATE email = email
      `, [process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@agrimarket.com', adminPassword]);
    }

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
      INSERT INTO categories (id, name, description, icon, image_url, is_active, sort_order) VALUES
      ('cat-veg', 'Vegetables', 'Fresh local leafy greens, roots and daily harvests', 'Leaf', '/images/kangkong.jpg', true, 1),
      ('cat-fruits', 'Fruits', 'Tree-ripened sweet Carabao mangoes, bananas & tropical harvests', 'Apple', '/images/mango.jpg', true, 2),
      ('cat-rice', 'Rice', 'Mindanao milled Dinorado, Sinandomeng, brown and black rice', 'Wheat', '/images/rice.jpg', true, 3),
      ('cat-grains', 'Grains', 'Mindanao sweet yellow corn, white flint, sorghum and grain feeds', 'Wheat', '/images/corn.jpg', true, 4),
      ('cat-supplies', 'Farm Supplies', 'Organic fertilizers, compost, planting seeds and farm tools', 'Sprout', '/images/compost.jpg', true, 5),
      ('cat-poultry', 'Livestock & Poultry', 'Farm-fresh pasture brown eggs, dairy and poultry', 'Egg', '/images/eggs.jpg', true, 6),
      ('cat-fish', 'Fisheries & Aquaculture', 'Lake Sebu spring tilapia and General Santos fresh catch', 'Fish', '/images/tilapia.jpg', true, 7)
      ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
    `);

    // Insert sample coupons
    console.log('Seeding coupons...');
    await connection.query(`
      INSERT INTO coupons (code, discount, type, min_spend, description, is_active) VALUES
      ('FREESHIP', 50.00, 'shipping', 300.00, 'Free shipping on orders ₱300+', true),
      ('NEWBUYER50', 50.00, 'fixed', 250.00, '₱50 off for first-time buyers', true),
      ('HARVEST100', 100.00, 'fixed', 800.00, '₱100 off on bulk orders ₱800+', true),
      ('SOCCSKSARGEN20', 20.00, 'fixed', 150.00, '₱20 discount on local deliveries', true)
      ON DUPLICATE KEY UPDATE discount = VALUES(discount), description = VALUES(description)
    `);

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
