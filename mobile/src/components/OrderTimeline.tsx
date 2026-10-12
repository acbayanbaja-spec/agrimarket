import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Order } from '../context/StoreContext';

const steps = [
  { key: 'Pending', label: 'Placed', icon: 'document-text-outline' },
  { key: 'Confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { key: 'Preparing', label: 'Packing', icon: 'cube-outline' },
  { key: 'Ready for Pickup', label: 'Ready', icon: 'time-outline' },
  { key: 'Out for delivery', label: 'Transit', icon: 'car-outline' },
  { key: 'Delivered', label: 'Delivered', icon: 'home-outline' },
] as const;

function getProgressIndex(status: string): number {
  if (status === 'Cancelled') return -1;
  if (status === 'Pending') return 0;
  if (status === 'Confirmed') return 1;
  if (status === 'Preparing') return 2;
  if (status === 'Ready for Pickup') return 3;
  if (status === 'Shipped' || status === 'Out for delivery') return 4;
  if (status === 'Delivered') return 5;
  return 0;
}

const statusDescriptions: Record<string, string> = {
  Pending: 'Awaiting farmer confirmation at the SOCCSKSARGEN stall.',
  Confirmed: 'Farm stall confirmed harvest order. Queued for sorting.',
  Preparing: 'Farmers are washing, packaging, and crate-packing produce.',
  'Ready for Pickup': 'Packed crates are staged at the stall ready for courier pickup.',
  Shipped: 'Courier picked up crates and is routing across the region.',
  'Out for delivery': 'Rider is on final drop-off route. Please prepare payment.',
  Delivered: 'Harvest safely received! Earned loyalty coins credited.',
  Cancelled: 'Order cancelled. Stock has been safely restored.',
};

export default function OrderTimeline({ order }: { order: Order }) {
  const [showAudit, setShowAudit] = useState(false);
  const status = order.status;
  const history = (order as any).statusHistory || [];

  if (status === 'Cancelled') {
    return (
      <View style={styles.cancelledBox}>
        <Ionicons name="alert-circle" size={16} color="#dc2626" />
        <Text style={styles.cancelledText}>{statusDescriptions.Cancelled}</Text>
      </View>
    );
  }

  const activeIndex = getProgressIndex(status);

  return (
    <View style={styles.container}>
      {/* Visual Stepper */}
      <View style={styles.stepperRow}>
        {steps.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={step.key}>
              {idx > 0 && (
                <View
                  style={[
                    styles.stepperLine,
                    idx <= activeIndex && styles.stepperLineActive,
                  ]}
                />
              )}
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isCurrent && styles.stepCircleActive,
                  ]}
                >
                  <Ionicons
                    name={step.icon as any}
                    size={11}
                    color={isCurrent || isDone ? '#ffffff' : '#9ca3af'}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelActive,
                    isDone && styles.stepLabelDone,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Description & Toggle */}
      <View style={styles.descCard}>
        <View style={styles.descRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.descText} numberOfLines={2}>
            {statusDescriptions[status] || statusDescriptions.Pending}
          </Text>
        </View>

        {history.length > 0 && (
          <TouchableOpacity
            style={styles.auditToggle}
            onPress={() => setShowAudit(!showAudit)}
          >
            <Text style={styles.auditToggleText}>
              {showAudit ? 'Hide Audit ▲' : `Audit (${history.length}) ▼`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Audit Log Breakdown */}
      {showAudit && history.length > 0 && (
        <View style={styles.auditList}>
          {history.map((h: any, i: number) => (
            <View key={i} style={styles.auditItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditStatus}>{h.status}</Text>
                <Text style={styles.auditActor}>
                  by {h.changedByName || 'Platform'} ({h.changedByRole || 'system'})
                </Text>
                {h.note ? <Text style={styles.auditNote}>"{h.note}"</Text> : null}
              </View>
              <Text style={styles.auditTime}>
                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 6,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
  },
  cancelledText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginBottom: 14,
  },
  stepperLineActive: {
    backgroundColor: '#16a34a',
  },
  stepCol: {
    alignItems: 'center',
    width: 44,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  stepCircleDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  stepCircleActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
    transform: [{ scale: 1.15 }],
  },
  stepLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
  },
  stepLabelDone: {
    color: '#15803d',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: '800',
  },
  descCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  descText: {
    fontSize: 10.5,
    color: '#065f46',
    fontWeight: '600',
    flex: 1,
  },
  auditToggle: {
    paddingLeft: 6,
  },
  auditToggleText: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '800',
  },
  auditList: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    gap: 6,
  },
  auditItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 3,
  },
  auditStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1f2937',
  },
  auditActor: {
    fontSize: 10,
    color: '#6b7280',
  },
  auditNote: {
    fontSize: 9.5,
    fontStyle: 'italic',
    color: '#4b5563',
    marginTop: 1,
  },
  auditTime: {
    fontSize: 9.5,
    color: '#9ca3af',
  },
});
