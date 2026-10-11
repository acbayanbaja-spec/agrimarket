import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../context/StoreContext';
import { shippingCoupons } from '../data/catalog';

export default function VouchersModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { claimedVouchers, claimVoucher } = useStore();

  const handleClaim = (code: string) => {
    const success = claimVoucher(code);
    if (success) {
      Alert.alert('Voucher Claimed! 🎟️', `Code ${code} will be applied automatically at checkout.`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="ticket" size={24} color="#15803d" />
            <Text style={styles.headerTitle}>AgriMarket Voucher Center</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <Text style={styles.bannerNote}>
          Claim daily farm vouchers to enjoy free shipping and wholesale discounts!
        </Text>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {shippingCoupons.map((voucher) => {
            const isClaimed = claimedVouchers.includes(voucher.code);
            return (
              <View key={voucher.code} style={styles.voucherCard}>
                <View style={styles.voucherLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={voucher.code === 'FREESHIP' ? 'car' : voucher.code.includes('COIN') ? 'logo-bitcoin' : 'pricetag'}
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.voucherCode}>{voucher.code}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.voucherRight}>
                  <Text style={styles.voucherDesc}>{voucher.description}</Text>
                  <Text style={styles.voucherCondition}>
                    {voucher.minOrder > 0 ? `Min. spend ₱${voucher.minOrder}` : 'No minimum spend'} · SOCCSKSARGEN
                  </Text>
                  <TouchableOpacity
                    style={[styles.claimBtn, isClaimed && styles.claimedBtn]}
                    disabled={isClaimed}
                    onPress={() => handleClaim(voucher.code)}
                  >
                    <Text style={[styles.claimText, isClaimed && styles.claimedText]}>
                      {isClaimed ? 'CLAIMED ✓' : 'CLAIM'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn: { padding: 4 },
  bannerNote: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  scrollContent: { padding: 16, gap: 12 },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  voucherLeft: {
    width: 100,
    backgroundColor: '#15803d',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  voucherCode: { color: '#fff', fontWeight: '800', fontSize: 13 },
  divider: { width: 1, height: '80%', backgroundColor: '#e5e7eb', borderStyle: 'dashed' },
  voucherRight: { flex: 1, padding: 14, gap: 4 },
  voucherDesc: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  voucherCondition: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  claimBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  claimedBtn: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  claimText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  claimedText: { color: '#9ca3af' },
});
