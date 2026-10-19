import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../src/context/AuthContext';
import { useStore } from '../src/context/StoreContext';
import { formatPeso } from '../src/lib/utils';
import { categories } from '../src/data/catalog';
import { soccsksargenPlaces } from '../src/data/locations';

type SellerTab = 'orders' | 'inventory' | 'feed';

export default function SellerScreen() {
  const { user, hasRole } = useAuth();
  const {
    orders,
    confirmOrder,
    markShipped,
    addPost,
    products,
    addNewProduct,
    updateProductStock,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SellerTab>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'Pending' | 'Confirmed' | 'Shipped'>('all');
  const [feedBody, setFeedBody] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New Product Form State
  const [newCropName, setNewCropName] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0].name);
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newStock, setNewStock] = useState('50');
  const [newLocation, setNewLocation] = useState(soccsksargenPlaces[0].label);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOrganic, setNewOrganic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mine = orders.filter(
    (order) =>
      order.items.some((item) => item.sellerUserId === user?.id || (user?.email === 'seller@agrimarket.com' && item.sellerId === 'seller-1'))
  );

  const listings = products.filter(
    (product) =>
      product.sellerUserId === user?.id ||
      (user?.email === 'seller@agrimarket.com' && (product.sellerId === 'seller-1' || product.sellerUserId === 2))
  );

  const totalGrossSales = mine.reduce((sum, o) => sum + o.total, 0);

  const pendingPackCount = mine.filter((o) => o.status === 'Pending').length;

  const filteredOrders = mine.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const handleCreateProduct = async () => {
    if (!newCropName.trim() || !newPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter both the crop name and price per unit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addNewProduct({
        name: newCropName.trim(),
        category: newCategory,
        price: parseFloat(newPrice) || 100,
        unit: newUnit,
        stock: parseInt(newStock, 10) || 50,
        location: newLocation,
        image: newImageUrl.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        description: newDescription.trim() || `Freshly harvested ${newCropName.trim()} from ${newLocation}.`,
        organic: newOrganic,
        seller: user?.firstName ? `${user.firstName} ${user.lastName} Farm` : 'Green Valley Farm',
        sellerId: user?.id ? `seller-${user.id}` : 'seller-1',
        sellerUserId: user?.id || 2,
      });

      setShowAddProductModal(false);
      setNewCropName('');
      setNewPrice('');
      setNewStock('50');
      setNewDescription('');
      setNewImageUrl('');
      Alert.alert('Harvest Published! 🎉', `${newCropName} is now live and broadcasted to all buyers on the marketplace.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not publish listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasRole('seller') && !hasRole('admin')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockContainer}>
          <Ionicons name="storefront-outline" size={64} color="#15803d" />
          <Text style={styles.lockTitle}>AgriMarket Seller Desk</Text>
          <Text style={styles.lockSubtitle}>
            Direct farm-to-table access. Apply with valid farmer KYC documents to list your produce directly to thousands of buyers.
          </Text>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => router.push('/become-seller')}
          >
            <Text style={styles.applyBtnText}>Become an Accredited Seller</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#15803d" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopee-Style Seller Centre</Text>
        <TouchableOpacity
          style={styles.addHarvestBtn}
          onPress={() => setShowAddProductModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addHarvestBtnText}>+ Add Crop</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Sales Performance Dashboard Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sales</Text>
            <Text style={styles.metricValue}>{formatPeso(totalGrossSales)}</Text>
            <Text style={styles.metricTrend}>📈 +18% vs last week</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Orders To Pack</Text>
            <Text style={[styles.metricValue, { color: '#ea580c' }]}>{pendingPackCount}</Text>
            <Text style={styles.metricSub}>⚡ Requires action</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active Stalls</Text>
            <Text style={styles.metricValue}>{listings.length}</Text>
            <Text style={styles.metricSub}>🌾 Certified fresh</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Shop Rating</Text>
            <Text style={[styles.metricValue, { color: '#eab308' }]}>4.9 ★</Text>
            <Text style={styles.metricSub}>⭐ Preferred Seller</Text>
          </View>
        </View>

        {/* Tab Navigator */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Ionicons
              name="receipt-outline"
              size={18}
              color={activeTab === 'orders' ? '#15803d' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              Orders ({mine.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'inventory' && styles.tabItemActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Ionicons
              name="cube-outline"
              size={18}
              color={activeTab === 'inventory' ? '#15803d' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
              Harvest Inventory ({listings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'feed' && styles.tabItemActive]}
            onPress={() => setActiveTab('feed')}
          >
            <Ionicons
              name="megaphone-outline"
              size={18}
              color={activeTab === 'feed' ? '#15803d' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
              Farm Feed Updates
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <View style={styles.tabSection}>
            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
              {(['all', 'Pending', 'Confirmed', 'Shipped'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterPill, orderFilter === status && styles.filterPillActive]}
                  onPress={() => setOrderFilter(status)}
                >
                  <Text style={[styles.filterPillText, orderFilter === status && styles.filterPillTextActive]}>
                    {status === 'all' ? 'All Orders' : status === 'Pending' ? 'To Pack (Pending)' : status === 'Confirmed' ? 'Ready for Rider' : 'Shipped'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="file-tray-outline" size={40} color="#94a3b8" />
                <Text style={styles.emptyCardText}>No orders in this category</Text>
              </View>
            ) : (
              filteredOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <View>
                      <Text style={styles.orderCardId}>{order.id}</Text>
                      <Text style={styles.orderCardDate}>{new Date(order.createdAt).toLocaleDateString()} · {order.payment}</Text>
                    </View>
                    <View style={[styles.statusTag, order.status === 'Pending' ? styles.statusTagPending : styles.statusTagConfirmed]}>
                      <Text style={styles.statusTagText}>{order.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.buyerBox}>
                    <Text style={styles.buyerName}>👤 {order.buyerName} ({order.buyerPhone || 'No phone'})</Text>
                    <Text style={styles.buyerAddress}>📍 {order.address}</Text>
                  </View>

                  {/* Order Items Breakdown */}
                  {(() => {
                    const myItems = order.items.filter(
                      (item) =>
                        item.isMine ||
                        item.sellerUserId === user?.id ||
                        (user?.email === 'seller@agrimarket.com' && (item.sellerId === 'seller-1' || item.sellerUserId === 2))
                    );
                    const otherItems = order.items.filter((item) => !myItems.some((m) => m.productId === item.productId));
                    const allMyItemsConfirmed = myItems.length > 0 && myItems.every((it) => it.prepStatus === 'packed' || it.sellerConfirmed);

                    return (
                      <View style={{ gap: 10 }}>
                        {/* Your Produce Section */}
                        <View style={styles.orderItemsList}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#15803d', marginBottom: 6 }}>
                            Your Produce (Action Required):
                          </Text>
                          {myItems.map((item) => (
                            <View key={item.productId} style={[styles.orderItemRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 4, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                <Text style={styles.orderItemName}>{item.quantity}× {item.name}</Text>
                                <Text style={styles.orderItemSubtotal}>{formatPeso(item.price * item.quantity)}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 2 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: item.prepStatus === 'packed' || item.sellerConfirmed ? '#16a34a' : '#ea580c' }}>
                                  {item.prepStatus === 'packed' || item.sellerConfirmed ? '✓ Packed & Confirmed' : '⏳ Ready to pack'}
                                </Text>
                                {order.status === 'Pending' && !(item.prepStatus === 'packed' || item.sellerConfirmed) && (
                                  <TouchableOpacity
                                    style={{ backgroundColor: '#15803d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                                    onPress={() => confirmOrder(order.id, item.productId)}
                                  >
                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Confirm This Product</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>

                        {/* Other Sellers' Products (Read-Only) */}
                        {otherItems.length > 0 && (
                          <View style={[styles.orderItemsList, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 10, padding: 8 }]}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 4 }}>
                              Other Sellers' Produce in this Order ({otherItems.length}):
                            </Text>
                            <Text style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>
                              Only the designated seller can confirm & pack their own products.
                            </Text>
                            {otherItems.map((item) => (
                              <View key={item.productId} style={[styles.orderItemRow, { paddingVertical: 4 }]}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.orderItemName, { color: '#64748b' }]}>{item.quantity}× {item.name}</Text>
                                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>Seller: {item.seller}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: item.prepStatus === 'packed' || item.sellerConfirmed ? '#16a34a' : '#d97706' }}>
                                    {item.prepStatus === 'packed' || item.sellerConfirmed ? '✓ Confirmed by Seller' : '⏳ Awaiting Seller'}
                                  </Text>
                                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>🔒 Locked</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={styles.orderCardFooter}>
                          <View>
                            <Text style={styles.totalLabel}>Total Payout:</Text>
                            <Text style={styles.totalAmount}>{formatPeso(order.total)}</Text>
                          </View>

                          {order.status === 'Pending' && (
                            !allMyItemsConfirmed ? (
                              <TouchableOpacity
                                style={styles.actionBtnPrimary}
                                onPress={() => confirmOrder(order.id)}
                              >
                                <Ionicons name="checkmark-done" size={16} color="#fff" />
                                <Text style={styles.actionBtnText}>Confirm All My Produce</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={[styles.doneBadge, { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1 }]}>
                                <Text style={[styles.doneBadgeText, { color: '#16a34a' }]}>
                                  {otherItems.length > 0 && !otherItems.every((it) => it.prepStatus === 'packed' || it.sellerConfirmed)
                                    ? '✓ Your Produce Confirmed · Waiting on Others'
                                    : '✓ All Products Confirmed'}
                                </Text>
                              </View>
                            )
                          )}

                          {order.status === 'Confirmed' && (
                            <TouchableOpacity
                              style={[styles.actionBtnPrimary, { backgroundColor: '#0284c7' }]}
                              onPress={() => markShipped(order.id)}
                            >
                              <Ionicons name="bicycle" size={16} color="#fff" />
                              <Text style={styles.actionBtnText}>Hand Over to Rider</Text>
                            </TouchableOpacity>
                          )}

                          {order.status === 'Shipped' && (
                            <View style={styles.doneBadge}>
                              <Text style={styles.doneBadgeText}>✓ In Transit with Rider</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })()}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <View style={styles.tabSection}>
            <View style={styles.inventoryHeader}>
              <Text style={styles.inventoryTitle}>Your Listed Harvests</Text>
              <Text style={styles.inventorySub}>Tap quick replenishments (+10kg, +50kg) to update live stock</Text>
            </View>

            {listings.map((prod) => (
              <View key={prod.id} style={styles.productRowCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.productRowName}>{prod.name}</Text>
                    {prod.organic && (
                      <View style={styles.organicBadge}>
                        <Text style={styles.organicBadgeText}>BIO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productRowPrice}>
                    {formatPeso(prod.price)} / {prod.unit} · {prod.category}
                  </Text>
                  <Text style={[styles.productRowStock, prod.stock <= 10 && { color: '#dc2626' }]}>
                    Current Stock: <Text style={{ fontWeight: '800' }}>{prod.stock} {prod.unit}</Text> {prod.stock <= 10 ? '(Low Stock!)' : '(Available)'}
                  </Text>
                </View>

                {/* Quick Add Stock Buttons */}
                <View style={styles.stockBtnsCol}>
                  <TouchableOpacity
                    style={styles.quickStockBtn}
                    onPress={() => updateProductStock(prod.id, prod.stock + 10)}
                  >
                    <Text style={styles.quickStockBtnText}>+10 {prod.unit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickStockBtn, { backgroundColor: '#15803d' }]}
                    onPress={() => updateProductStock(prod.id, prod.stock + 50)}
                  >
                    <Text style={[styles.quickStockBtnText, { color: '#fff' }]}>+50 {prod.unit}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: FEED UPDATES */}
        {activeTab === 'feed' && (
          <View style={styles.tabSection}>
            <View style={styles.feedBox}>
              <Text style={styles.feedTitle}>Publish Live Farm Update</Text>
              <Text style={styles.feedDesc}>
                Broadcast fresh harvest dates or special wholesale discounts to the AgriMarket community feed.
              </Text>
              <TextInput
                style={styles.feedInput}
                placeholder="Halimbawa: Bagong ani ng matatamis na mangga mula Midsayap! Ice packs included for wholesale orders..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={feedBody}
                onChangeText={setFeedBody}
              />
              <TouchableOpacity
                style={[styles.actionBtnPrimary, !feedBody.trim() && { opacity: 0.6 }]}
                onPress={() => {
                  if (!feedBody.trim()) return;
                  addPost({
                    body: feedBody.trim(),
                    category: listings[0]?.category || 'Vegetables',
                    productId: listings[0]?.id,
                    productName: listings[0]?.name,
                  });
                  setFeedBody('');
                  Alert.alert('Posted! 📢', 'Your farm story is now visible on the community feed.');
                }}
                disabled={!feedBody.trim()}
              >
                <Ionicons name="paper-plane" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Broadcast to Product Feed</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ADD HARVEST PRODUCT MODAL */}
      <Modal
        visible={showAddProductModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Publish New Harvest</Text>
                <Text style={styles.modalSub}>Broadcasted live to all buyer devices immediately</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddProductModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
              <View>
                <Text style={styles.inputLabel}>Crop / Harvest Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Halimbawa: Sweet Native Corn, Red Creole Onion"
                  placeholderTextColor="#94a3b8"
                  value={newCropName}
                  onChangeText={setNewCropName}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.name}
                      style={[styles.catChip, newCategory === c.name && styles.catChipActive]}
                      onPress={() => setNewCategory(c.name)}
                    >
                      <Text style={[styles.catChipText, newCategory === c.name && styles.catChipTextActive]}>
                        {c.emoji} {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price (₱) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="90"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newPrice}
                    onChangeText={setNewPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="kg / pack / tray"
                    placeholderTextColor="#94a3b8"
                    value={newUnit}
                    onChangeText={setNewUnit}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Initial Stock</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="50"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newStock}
                    onChangeText={setNewStock}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Farm Location *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
                  {soccsksargenPlaces.map((p) => (
                    <TouchableOpacity
                      key={p.label}
                      style={[styles.catChip, newLocation === p.label && styles.catChipActive]}
                      onPress={() => setNewLocation(p.label)}
                    >
                      <Text style={[styles.catChipText, newLocation === p.label && styles.catChipTextActive]}>
                        📍 {p.city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text style={styles.inputLabel}>Image URL (or unspash high-res)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://images.unsplash.com/photo-..."
                  placeholderTextColor="#94a3b8"
                  value={newImageUrl}
                  onChangeText={setNewImageUrl}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Description & Freshness Notes</Text>
                <TextInput
                  style={[styles.modalInput, { height: 70 }]}
                  placeholder="Ani ngayong umaga mula sa mataas na bundok. Walang chemical pesticides..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={newDescription}
                  onChangeText={setNewDescription}
                />
              </View>

              <TouchableOpacity
                style={styles.organicToggle}
                onPress={() => setNewOrganic(!newOrganic)}
              >
                <Ionicons
                  name={newOrganic ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={newOrganic ? '#15803d' : '#94a3b8'}
                />
                <Text style={styles.organicToggleText}>Naturally Grown / Organic Certified (Green Bio Badge)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnPrimary, { marginTop: 12 }]}
                onPress={handleCreateProduct}
                disabled={isSubmitting}
              >
                <Ionicons name="cloud-upload" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>
                  {isSubmitting ? 'Broadcasting Harvest...' : 'Publish to Online Marketplace'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  addHarvestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHarvestBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 4,
  },
  metricTrend: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  metricSub: {
    fontSize: 11,
    color: '#64748b',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#dcfce7',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },
  tabSection: {
    gap: 12,
  },
  filterPillsRow: {
    gap: 8,
    marginBottom: 4,
  },
  filterPill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterPillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  orderCardId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  orderCardDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagPending: {
    backgroundColor: '#ffedd5',
  },
  statusTagConfirmed: {
    backgroundColor: '#dcfce7',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c2410c',
  },
  buyerBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  buyerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  buyerAddress: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  orderItemsList: {
    gap: 4,
    marginBottom: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 13,
    color: '#334155',
  },
  orderItemSubtotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  doneBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  inventoryHeader: {
    marginBottom: 4,
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  inventorySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  productRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productRowName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  organicBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  organicBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  productRowPrice: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  productRowStock: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 3,
  },
  stockBtnsCol: {
    gap: 6,
  },
  quickStockBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickStockBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  feedBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  feedDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  feedInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 13,
    color: '#0f172a',
  },
  catChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  catChipActive: {
    backgroundColor: '#15803d',
  },
  catChipText: {
    fontSize: 12,
    color: '#475569',
  },
  catChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  organicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  organicToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 16,
  },
  lockSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  applyBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
