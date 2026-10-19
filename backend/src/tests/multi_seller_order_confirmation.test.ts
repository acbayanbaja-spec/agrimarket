import { db, OrderEntity } from '../database/store';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runMultiSellerTests() {
  console.log('Running multi-seller order confirmation tests...');

  // Setup test order with 3 different sellers:
  // Seller 2: Fruits (Mango)
  // Seller 13: Grain (Corn)
  // Seller 15: Fish (Tilapia)
  const testOrderId = `TEST-ORD-${Date.now()}`;
  const testOrder: OrderEntity = {
    id: testOrderId,
    receiptNo: `RCPT-${testOrderId}`,
    userId: 1, // Buyer
    buyerName: 'Juan Dela Cruz',
    buyerPhone: '+639171234567',
    address: 'Koronadal City',
    payment: 'GCash',
    status: 'Pending',
    subtotal: 750,
    shippingFee: 50,
    shippingDiscount: 0,
    pointsEarned: 75,
    pointsRedeemed: 0,
    total: 800,
    createdAt: new Date().toISOString(),
    prepStatus: 'unpacked',
    items: [
      {
        productId: 'prod-fruits-1',
        name: 'Fresh Carabao Mango',
        price: 150,
        quantity: 2,
        unit: 'kg',
        image: '/mango.jpg',
        seller: 'Maria Santos Fruit Farm',
        sellerId: 'seller-2',
        sellerUserId: 2,
        pickupLocation: 'Koronadal City',
        prepStatus: 'unpacked',
      },
      {
        productId: 'prod-grain-1',
        name: 'Organic Yellow Corn',
        price: 90,
        quantity: 3,
        unit: 'kg',
        image: '/corn.jpg',
        seller: 'Eduardo Dizon Grain Farm',
        sellerId: 'seller-13',
        sellerUserId: 13,
        pickupLocation: 'Midsayap',
        prepStatus: 'unpacked',
      },
      {
        productId: 'prod-fish-1',
        name: 'Fresh Lake Sebu Tilapia',
        price: 180,
        quantity: 1,
        unit: 'kg',
        image: '/tilapia.jpg',
        seller: 'General Santos Fishery',
        sellerId: 'seller-15',
        sellerUserId: 15,
        pickupLocation: 'GenSan Port',
        prepStatus: 'unpacked',
      },
    ],
  };

  db.addOrder(testOrder);

  // Test 1: Seller 2 tries to pack Seller 13's product (Corn) -> MUST BE REJECTED
  let rejected = false;
  try {
    db.updateOrderItemPrep(testOrderId, 'prod-grain-1', 'packed', undefined, 2);
  } catch (err: any) {
    rejected = true;
    assert(err.message.includes('Unauthorized'), 'Error message must specify unauthorized');
  }
  assert(rejected, 'Seller 2 must NOT be allowed to pack Seller 13 grain product');

  // Test 2: Seller 2 tries to pack Seller 15's product (Fish) -> MUST BE REJECTED
  rejected = false;
  try {
    db.updateOrderItemPrep(testOrderId, 'prod-fish-1', 'packed', undefined, 2);
  } catch (err: any) {
    rejected = true;
  }
  assert(rejected, 'Seller 2 must NOT be allowed to pack Seller 15 fish product');

  // Test 3: Seller 2 packs their own product (Mango) -> MUST SUCCEED
  const res1 = db.updateOrderItemPrep(testOrderId, 'prod-fruits-1', 'packed', 'Inspected fresh', 2);
  assert(res1 !== null, 'Order must be updated');
  const fruitsItem = res1!.items.find((i) => i.productId === 'prod-fruits-1');
  const grainItem = res1!.items.find((i) => i.productId === 'prod-grain-1');
  const fishItem = res1!.items.find((i) => i.productId === 'prod-fish-1');

  assert(fruitsItem?.prepStatus === 'packed', 'Fruits item must be packed');
  assert(fruitsItem?.sellerConfirmed === true, 'Fruits item must be sellerConfirmed');
  assert(grainItem?.prepStatus === 'unpacked', 'Grain item must remain unpacked');
  assert(fishItem?.prepStatus === 'unpacked', 'Fish item must remain unpacked');
  assert(res1!.status === 'Pending', 'Order status must remain Pending since other sellers have not confirmed');

  // Test 4: Seller 13 confirms their own product (Corn)
  const res2 = db.confirmSellerItems(testOrderId, 13, 'prod-grain-1');
  assert(res2 !== null, 'confirmSellerItems must succeed for grain');
  assert(res2!.confirmedCount === 1, '1 item should be confirmed');
  assert(res2!.pendingCount === 1, '1 item (fish) should still be pending');
  assert(res2!.order.status === 'Pending', 'Order must still be Pending because fish is unconfirmed');

  // Test 5: Seller 15 confirms their product (Fish) -> ALL ITEMS CONFIRMED!
  const res3 = db.confirmSellerItems(testOrderId, 15, 'prod-fish-1');
  assert(res3 !== null, 'confirmSellerItems must succeed for fish');
  assert(res3!.pendingCount === 0, '0 items should be pending');
  assert(res3!.order.status === 'Confirmed', 'Order must transition to Confirmed once all sellers confirmed');
  assert(res3!.order.prepStatus === 'packed', 'Order prepStatus must be packed');
  assert(Boolean(res3!.order.sellerConfirmedAt), 'sellerConfirmedAt must be set on order');

  console.log('✓ Multi-seller order confirmation tests passed successfully!');
}

runMultiSellerTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
