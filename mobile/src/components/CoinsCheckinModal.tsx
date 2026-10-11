import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../context/StoreContext';

const STREAK_DAYS = [
  { day: 1, reward: 5 },
  { day: 2, reward: 10 },
  { day: 3, reward: 15 },
  { day: 4, reward: 20 },
  { day: 5, reward: 25 },
  { day: 6, reward: 30 },
  { day: 7, reward: 50 },
];

export default function CoinsCheckinModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { agriCoins, dailyCheckinClaimed, claimDailyCheckin } = useStore();

  const handleClaim = () => {
    const earned = claimDailyCheckin();
    if (earned > 0) {
      Alert.alert('🎉 Coins Claimed!', `You received +${earned} AgriCoins! Use them at checkout for instant discounts.`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          <View style={styles.goldOrb}>
            <Text style={styles.goldOrbText}>🪙</Text>
          </View>

          <Text style={styles.title}>AgriCoins Rewards</Text>
          <Text style={styles.balance}>
            Your Balance: <Text style={styles.balanceNum}>{agriCoins} Coins</Text>
          </Text>
          <Text style={styles.exchangeRate}>1 AgriCoin = ₱1 discount on your harvest crate</Text>

          {/* 7-Day Streak Row */}
          <View style={styles.streakRow}>
            {STREAK_DAYS.map((item) => (
              <View key={item.day} style={styles.dayBox}>
                <Text style={styles.dayText}>D{item.day}</Text>
                <View style={styles.coinCircle}>
                  <Text style={styles.coinMini}>🪙</Text>
                </View>
                <Text style={styles.rewardText}>+{item.reward}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.claimButton, dailyCheckinClaimed && styles.claimedButton]}
            disabled={dailyCheckinClaimed}
            onPress={handleClaim}
          >
            <Text style={styles.claimButtonText}>
              {dailyCheckinClaimed ? 'Checked In Today ✓' : 'Check In Today (+15 Coins)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  goldOrb: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  goldOrbText: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  balance: { fontSize: 15, color: '#4b5563', marginTop: 4 },
  balanceNum: { color: '#d97706', fontWeight: '800', fontSize: 18 },
  exchangeRate: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 16 },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  dayBox: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    marginHorizontal: 2,
  },
  dayText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  coinCircle: { marginVertical: 4 },
  coinMini: { fontSize: 16 },
  rewardText: { fontSize: 10, fontWeight: '800', color: '#b45309' },
  claimButton: {
    width: '100%',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  claimedButton: { backgroundColor: '#9ca3af' },
  claimButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
