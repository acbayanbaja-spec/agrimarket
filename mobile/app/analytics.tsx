import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../src/context/AuthContext';
import { mobileApi } from '../src/services/api';
import { formatPeso } from '../src/lib/utils';

export default function MobileAnalyticsScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState<'7d' | '30d' | 'year' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchAnalytics = async (selectedRange: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await mobileApi.get<any>(`/analytics/me?range=${selectedRange}`);
      setData(res?.data || res);
    } catch (err: any) {
      setError(err?.message || 'Could not load server analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const metrics = data?.metrics || {};
  const metricEntries = Object.entries(metrics);

  const roleTitle =
    data?.role === 'buyer'
      ? 'My Spending Insights'
      : data?.role === 'delivery'
      ? 'Courier Delivery Stats'
      : data?.role === 'admin'
      ? 'Platform Master GMV'
      : 'Farmer Sales Desk';

  const formatValue = (key: string, val: any) => {
    if (['gmv', 'sales', 'spent'].includes(key.toLowerCase())) {
      return formatPeso(Number(val) || 0);
    }
    return String(val);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{roleTitle}</Text>
          <Text style={styles.subtitle}>
            Role: {user?.roles?.join(', ').toUpperCase()} · SOCCSKSARGEN Ledger
          </Text>
        </View>
      </View>

      {/* Date Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
          ] as const
        ).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterChip, range === item.id && styles.filterChipActive]}
            onPress={() => setRange(item.id)}
          >
            <Text style={[styles.filterChipText, range === item.id && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#15803d" />
            <Text style={styles.loadingText}>Fetching authoritative metrics...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#dc2626" />
            <Text style={styles.errorTitle}>Analytics Unavailable</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAnalytics(range)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* KPI Metrics Grid */}
            <View style={styles.kpiGrid}>
              {metricEntries.map(([k, v]) => (
                <View key={k} style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>
                    {k.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </Text>
                  <Text style={styles.kpiValue}>{formatValue(k, v)}</Text>
                </View>
              ))}
            </View>

            {/* Note Card */}
            <View style={styles.noticeCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#15803d" />
              <Text style={styles.noticeText}>
                Metrics are calculated strictly from authoritative database receipts. Cancelled orders and unverified transactions are omitted from sales totals.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterChipActive: { backgroundColor: '#15803d' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#4b5563' },
  filterChipTextActive: { color: '#ffffff' },
  scrollContent: { padding: 16, gap: 14 },
  centerBox: { padding: 48, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 13, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  errorTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  errorDesc: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#15803d',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  kpiLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700' },
  kpiValue: { fontSize: 18, color: '#111827', fontWeight: '900', marginTop: 4 },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  noticeText: { fontSize: 11, color: '#065f46', flex: 1, lineHeight: 16 },
});
