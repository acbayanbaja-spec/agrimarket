import fs from 'fs';
import path from 'path';
import pool from '../config/database';

export interface MigrationSummary {
  roles: number;
  users: number;
  userRoles: number;
  categories: number;
  products: number;
  orders: number;
  orderItems: number;
  deliveryJobs: number;
  reviews: number;
  notifications: number;
  messages: number;
  coupons: number;
  auditLogs: number;
  processedWebhooks: number;
  errors: number;
}

async function queryWithRetry(sql: string, params: any[] = [], maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.query(sql, params);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (
        attempt < maxRetries &&
        (msg.includes('ECONNRESET') ||
          msg.includes('closed') ||
          msg.includes('ETIMEDOUT') ||
          msg.includes('PROTOCOL_CONNECTION_LOST') ||
          msg.includes('Connection lost'))
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Query failed after max retries');
}

export async function migrateExistingData(customJsonPath?: string): Promise<MigrationSummary> {
  const jsonPath =
    customJsonPath ||
    process.env.DATA_BACKUP_PATH ||
    path.join(__dirname, '../../data/agrimarket_db.json');

  const summary: MigrationSummary = {
    roles: 0,
    users: 0,
    userRoles: 0,
    categories: 0,
    products: 0,
    orders: 0,
    orderItems: 0,
    deliveryJobs: 0,
    reviews: 0,
    notifications: 0,
    messages: 0,
    coupons: 0,
    auditLogs: 0,
    processedWebhooks: 0,
    errors: 0,
  };

  if (!fs.existsSync(jsonPath)) {
    console.warn(`[Data Migration] No source JSON file found at ${jsonPath}. Skipping data import.`);
    return summary;
  }

  console.log(`[Data Migration] Reading data from ${jsonPath}...`);
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (err: any) {
    console.error(`[Data Migration] Failed to parse JSON file: ${err.message}`);
    throw err;
  }

  console.log('[Data Migration] Starting safe migration to Supabase PostgreSQL database...');

  // 1. Roles
  const roles = [
    ['admin', 'System administrator with full access'],
    ['buyer', 'Regular buyer who can purchase products'],
    ['seller', 'Approved seller who can list products'],
    ['delivery', 'Delivery rider'],
    ['delivery_man', 'Delivery personnel who handle order deliveries'],
  ];
  for (const [name, desc] of roles) {
    await queryWithRetry(
      `INSERT INTO roles (name, description) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
      [name, desc]
    );
    summary.roles++;
  }

  // 2. Users
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      try {
        await queryWithRetry(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, profile_image, is_verified, is_active, suspension_reason, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             first_name = COALESCE(EXCLUDED.first_name, users.first_name),
             last_name = COALESCE(EXCLUDED.last_name, users.last_name),
             phone = COALESCE(EXCLUDED.phone, users.phone),
             profile_image = COALESCE(EXCLUDED.profile_image, users.profile_image),
             is_verified = EXCLUDED.is_verified,
             is_active = EXCLUDED.is_active`,
          [
            u.id,
            u.email,
            u.password_hash || u.password,
            u.first_name || u.firstName || 'User',
            u.last_name || u.lastName || '',
            u.phone || null,
            u.profile_image || u.profileImage || null,
            Boolean(u.is_verified),
            u.is_active !== false,
            u.suspension_reason || null,
            u.created_at ? new Date(u.created_at) : null,
          ]
        );
        summary.users++;

        // User Roles
        const userRoles = Array.isArray(u.roles) ? u.roles : ['buyer'];
        for (const roleName of userRoles) {
          const canonicalRole = roleName === 'delivery_man' || roleName === 'driver' || roleName === 'rider' ? 'delivery' : roleName;
          await queryWithRetry(
            `INSERT INTO user_roles (user_id, role_id)
             SELECT $1, id FROM roles WHERE name = $2
             ON CONFLICT (user_id, role_id) DO NOTHING`,
            [u.id, canonicalRole]
          );
          summary.userRoles++;
        }
      } catch (e: any) {
        console.error(`[Data Migration] User ${u.id || u.email} skipped:`, e.message);
        summary.errors++;
      }
    }
  }

  // Update sequences
  try {
    await queryWithRetry("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users");
    await queryWithRetry("SELECT setval(pg_get_serial_sequence('user_roles', 'id'), COALESCE(MAX(id), 1)) FROM user_roles");
  } catch {}

  // 3. Categories
  if (Array.isArray(data.categories)) {
    for (const c of data.categories) {
      try {
        await queryWithRetry(
          `INSERT INTO categories (id, name, description, icon, image_url, is_active, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             icon = EXCLUDED.icon,
             image_url = EXCLUDED.image_url`,
          [
            c.id,
            c.name,
            c.description || null,
            c.icon || null,
            c.imageUrl || c.image_url || null,
            c.isActive !== false,
            c.sortOrder || c.sort_order || 0,
          ]
        );
        summary.categories++;
      } catch (e: any) {
        console.error(`[Data Migration] Category ${c.id} skipped:`, e.message);
        summary.errors++;
      }
    }
  }

  // 4. Products
  if (Array.isArray(data.products)) {
    for (const p of data.products) {
      try {
        const sellerUserId = Number(p.sellerUserId || 1);
        await queryWithRetry(
          `INSERT INTO products (id, seller_user_id, seller_id, category, name, description, price, unit, stock, rating, reviews_count, image, location, farm_origin, badge, is_organic, is_active, is_deleted, is_unlisted, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, COALESCE($20, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             unit = EXCLUDED.unit,
             stock = EXCLUDED.stock,
             rating = EXCLUDED.rating,
             reviews_count = EXCLUDED.reviews_count,
             image = EXCLUDED.image,
             location = EXCLUDED.location,
             is_organic = EXCLUDED.is_organic,
             is_active = EXCLUDED.is_active,
             is_deleted = EXCLUDED.is_deleted,
             is_unlisted = EXCLUDED.is_unlisted`,
          [
            p.id,
            sellerUserId,
            p.sellerId || `seller-${sellerUserId}`,
            p.category,
            p.name,
            p.description || null,
            Number(p.price || 0),
            p.unit || 'kg',
            Number(p.stock || 0),
            Number(p.rating || 5.0),
            Number(p.reviews || p.reviews_count || 0),
            p.image || (Array.isArray(p.photos) && p.photos[0]) || null,
            p.location || null,
            p.farmOrigin || p.farm_origin || null,
            p.badge || null,
            Boolean(p.organic),
            p.isActive !== false && p.is_active !== false,
            Boolean(p.isDeleted),
            Boolean(p.isUnlisted),
            p.created_at ? new Date(p.created_at) : null,
          ]
        );
        summary.products++;
      } catch (e: any) {
        console.error(`[Data Migration] Product ${p.id} skipped:`, e.message);
        summary.errors++;
      }
    }
  }

  // 5. Orders & Order Items
  if (Array.isArray(data.orders)) {
    for (const o of data.orders) {
      try {
        const userId = Number(o.userId || 1);
        await queryWithRetry(
          `INSERT INTO orders (id, receipt_no, user_id, buyer_name, buyer_phone, address, subtotal, shipping_fee, shipping_discount, coupon_code, points_earned, points_redeemed, total, status, payment, payment_ref, payment_status, driver_id, lat, lng, prep_status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, COALESCE($22, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             payment_status = EXCLUDED.payment_status,
             driver_id = COALESCE(EXCLUDED.driver_id, orders.driver_id),
             prep_status = COALESCE(EXCLUDED.prep_status, orders.prep_status)`,
          [
            o.id,
            o.receiptNo || `RCPT-${o.id.replace('ORD-', '')}`,
            userId,
            o.buyerName || 'Buyer',
            o.buyerPhone || null,
            o.address || 'Address not provided',
            Number(o.subtotal || 0),
            Number(o.shippingFee || 50),
            Number(o.shippingDiscount || 0),
            o.couponCode || null,
            Number(o.pointsEarned || 0),
            Number(o.pointsRedeemed || 0),
            Number(o.total || 0),
            o.status || 'Pending',
            o.payment || 'GCash',
            o.paymentRef || null,
            o.paymentStatus || 'pending',
            o.driverId ? Number(o.driverId) : null,
            o.lat ? Number(o.lat) : null,
            o.lng ? Number(o.lng) : null,
            o.prepStatus || 'unpacked',
            o.createdAt ? new Date(o.createdAt) : null,
          ]
        );
        summary.orders++;

        // Items
        if (Array.isArray(o.items)) {
          for (const item of o.items) {
            try {
              await queryWithRetry(
                `INSERT INTO order_items (order_id, product_id, name, price, quantity, unit, image, seller, seller_id, seller_user_id, pickup_location, prep_status, prep_notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                  o.id,
                  item.productId,
                  item.name,
                  Number(item.price || 0),
                  Number(item.quantity || 1),
                  item.unit || 'kg',
                  item.image || null,
                  item.seller || null,
                  item.sellerId || null,
                  Number(item.sellerUserId || 1),
                  item.pickupLocation || null,
                  item.prepStatus || 'unpacked',
                  item.prepNotes || null,
                ]
              );
              summary.orderItems++;
            } catch {
              // Duplicate item or non-critical error
            }
          }
        }
      } catch (e: any) {
        console.error(`[Data Migration] Order ${o.id} skipped:`, e.message);
        summary.errors++;
      }
    }
  }

  try {
    await queryWithRetry("SELECT setval(pg_get_serial_sequence('order_items', 'id'), COALESCE(MAX(id), 1)) FROM order_items");
  } catch {}

  // 6. Delivery Jobs
  if (Array.isArray(data.delivery_jobs)) {
    for (const d of data.delivery_jobs) {
      try {
        const driverId = Number(d.driverId || 1);
        await queryWithRetry(
          `INSERT INTO delivery_jobs (id, order_id, driver_id, buyer_name, buyer_phone, address, status, lat, lng, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             driver_id = EXCLUDED.driver_id`,
          [
            d.id,
            d.orderId,
            driverId,
            d.buyerName || 'Buyer',
            d.buyerPhone || null,
            d.address || 'Address',
            d.status || 'Pending',
            d.lat ? Number(d.lat) : null,
            d.lng ? Number(d.lng) : null,
            d.updatedAt ? new Date(d.updatedAt) : null,
          ]
        );
        summary.deliveryJobs++;
      } catch (e: any) {
        summary.errors++;
      }
    }
  }

  // 7. Reviews
  if (Array.isArray(data.reviews)) {
    for (const r of data.reviews) {
      try {
        await queryWithRetry(
          `INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, photos, status, is_verified_purchase, order_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             comment = EXCLUDED.comment,
             rating = EXCLUDED.rating`,
          [
            r.id,
            r.productId,
            Number(r.userId || 1),
            r.userName || 'User',
            Math.min(5, Math.max(1, Number(r.rating || 5))),
            r.comment || '',
            JSON.stringify(r.photos || []),
            r.status || 'published',
            Boolean(r.isVerifiedPurchase),
            r.orderId || null,
            r.createdAt ? new Date(r.createdAt) : null,
          ]
        );
        summary.reviews++;
      } catch (e: any) {
        summary.errors++;
      }
    }
  }

  // 8. Notifications
  if (Array.isArray(data.notifications)) {
    for (const n of data.notifications) {
      try {
        const userId = Number(n.userId);
        if (isNaN(userId)) continue;
        await queryWithRetry(
          `INSERT INTO notifications (id, user_id, title, message, category, read_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             message = EXCLUDED.message`,
          [
            n.id,
            userId,
            n.title,
            n.message,
            n.category || 'General',
            JSON.stringify(n.readBy || []),
            n.createdAt ? new Date(n.createdAt) : null,
          ]
        );
        summary.notifications++;
      } catch (e: any) {
        summary.errors++;
      }
    }
  }

  // 9. Messages
  if (Array.isArray(data.messages)) {
    for (const m of data.messages) {
      try {
        await queryWithRetry(
          `INSERT INTO messages (id, order_id, from_role, from_name, from_user_id, to_user_id, phone, body, channel, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             body = EXCLUDED.body,
             status = EXCLUDED.status`,
          [
            m.id,
            m.orderId,
            m.fromRole || 'system',
            m.fromName || 'User',
            m.fromUserId ? Number(m.fromUserId) : null,
            Number(m.toUserId || 1),
            m.phone || null,
            m.body,
            m.channel || 'in-app',
            m.status || 'delivered',
            m.createdAt ? new Date(m.createdAt) : null,
          ]
        );
        summary.messages++;
      } catch (e: any) {
        summary.errors++;
      }
    }
  }

  // 10. Coupons
  if (Array.isArray(data.coupons)) {
    for (const cp of data.coupons) {
      try {
        await queryWithRetry(
          `INSERT INTO coupons (code, discount, type, min_spend, description, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (code) DO UPDATE SET
             discount = EXCLUDED.discount,
             min_spend = EXCLUDED.min_spend,
             description = EXCLUDED.description`,
          [
            cp.code,
            Number(cp.discount || 0),
            cp.type || 'fixed',
            Number(cp.minSpend || 0),
            cp.description || '',
            cp.isActive !== false,
          ]
        );
        summary.coupons++;
      } catch (e: any) {
        summary.errors++;
      }
    }
  }

  // 11. Audit Logs
  if (Array.isArray(data.audit_logs)) {
    for (const a of data.audit_logs) {
      try {
        await queryWithRetry(
          `INSERT INTO audit_logs (id, admin_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO UPDATE SET
             details = EXCLUDED.details`,
          [
            a.id,
            Number(a.adminId || 1),
            a.adminEmail || 'admin@agrimarket.com',
            a.action || 'system_event',
            a.targetType || 'system',
            String(a.targetId || '0'),
            typeof a.details === 'object' ? JSON.stringify(a.details) : String(a.details || ''),
            a.ipAddress || null,
            a.createdAt ? new Date(a.createdAt) : null,
          ]
        );
        summary.auditLogs++;
      } catch (e: any) {
        summary.errors++;
      }
    }
  }

  // 12. Processed Webhooks
  if (Array.isArray(data.processed_webhooks)) {
    for (const w of data.processed_webhooks) {
      try {
        await queryWithRetry(
          `INSERT INTO processed_webhooks (event_id, order_id, processed_at)
           VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP))
           ON CONFLICT (event_id) DO UPDATE SET
             processed_at = EXCLUDED.processed_at`,
          [
            w.eventId,
            w.orderId || null,
            w.processedAt ? new Date(w.processedAt) : null,
          ]
        );
        summary.processedWebhooks++;
      } catch (e: any) {
        summary.errors++;
      }
    }
  }

  console.log('[Data Migration] Migration completed successfully to Supabase PostgreSQL!');
  console.table(summary);

  return summary;
}

if (require.main === module) {
  migrateExistingData()
    .then(() => {
      console.log('✅ Data migration finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Data migration failed:', err);
      process.exit(1);
    });
}
