import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useStore, FlashDeal } from '../context/StoreContext';
import { productPhoto } from '../lib/images';
import { formatPeso } from '../lib/utils';
import { useCartSheet } from '../context/CartSheetContext';

export default function FlashSaleSection() {
  const { flashDeals } = useStore();
  const { openSheet } = useCartSheet();
  const [secondsLeft, setSecondsLeft] = useState(9840);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 14400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  if (!flashDeals || flashDeals.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header with Countdown */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.fireEmoji}>⚡</Text>
          <Text style={styles.headerTitle}>FLASH DEALS</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerDigit}>{pad(hours)}</Text>
            <Text style={styles.timerColon}>:</Text>
            <Text style={styles.timerDigit}>{pad(minutes)}</Text>
            <Text style={styles.timerColon}>:</Text>
            <Text style={styles.timerDigit}>{pad(seconds)}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/(tabs)/marketplace')}>
          <Text style={styles.seeAll}>See All &gt;</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Cards Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {flashDeals.map((deal) => {
          const { product, dealPrice, originalPrice, discountPercent, claimedPercent } = deal;
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => router.push(`/product/${product.id}` as any)}
            >
              {/* Product Image & Discount Tag */}
              <View style={styles.imageWrapper}>
                <Image source={productPhoto(product.image)} style={styles.image} />
                <View style={styles.discountPill}>
                  <Text style={styles.discountText}>-{discountPercent}%</Text>
                </View>
              </View>

              {/* Price Row */}
              <View style={styles.body}>
                <Text style={styles.dealPrice}>{formatPeso(dealPrice)}</Text>
                <Text style={styles.origPrice}>{formatPeso(originalPrice)}</Text>

                {/* Claimed Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${claimedPercent}%` }]} />
                  <Text style={styles.progressText}>🔥 {claimedPercent}% SOLD</Text>
                </View>

                {/* Instant Add Button */}
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    openSheet(product);
                  }}
                >
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fireEmoji: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#ea580c', letterSpacing: 0.5 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  timerDigit: {
    backgroundColor: '#1f2937',
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timerColon: { color: '#1f2937', fontWeight: '800', marginHorizontal: 2 },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#ea580c' },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: 138,
    backgroundColor: '#fafafa',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  imageWrapper: { width: '100%', height: 110, position: 'relative' },
  image: { width: '100%', height: '100%' },
  discountPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ea580c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  body: { padding: 8, gap: 2 },
  dealPrice: { fontSize: 15, fontWeight: '900', color: '#ea580c' },
  origPrice: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  progressContainer: {
    height: 16,
    backgroundColor: '#fed7aa',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ea580c',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    zIndex: 1,
  },
  addBtn: {
    marginTop: 6,
    backgroundColor: '#15803d',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
