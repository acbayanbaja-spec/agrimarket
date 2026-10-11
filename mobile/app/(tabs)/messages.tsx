import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/context/AuthContext';
import { useStore } from '../../src/context/StoreContext';
import { sellers } from '../../src/data/catalog';
import AiAssistantModal from '../../src/components/AiAssistantModal';

type ChatTab = 'farmers' | 'riders' | 'ai';

const QUICK_FARMER_INQUIRIES = [
  'Freshly harvested po ba ito ngayon?',
  'Available pa po ba for immediate delivery?',
  'May bulk discount po ba kung 20kg+?',
  'Pwede po ba mag-request ng ripe/unripe?',
];

export default function MessagesScreen() {
  const { user, hasRole, isAuthenticated } = useAuth();
  const {
    messages,
    orders,
    sendSms,
    directMessages,
    sendDirectMessage,
  } = useStore();

  const [activeTab, setActiveTab] = useState<ChatTab>('farmers');
  const [selectedSellerId, setSelectedSellerId] = useState(sellers[0].id);
  const [farmerInput, setFarmerInput] = useState('');
  const [riderBody, setRiderBody] = useState('On the way po. Please prepare payment.');
  const [notice, setNotice] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Active seller details
  const activeSeller = sellers.find((s) => s.id === selectedSellerId) || sellers[0];
  const stallThread = directMessages.filter((m) => m.sellerId === activeSeller.id);

  // Relevant orders for delivery chat
  const relevantOrders = useMemo(() => {
    if (!user) return orders;
    if (hasRole('admin')) return orders;
    return orders.filter((order) => order.userId === user.id || order.driverId === user.id);
  }, [orders, user, hasRole]);

  const [orderId, setOrderId] = useState(relevantOrders[0]?.id || '');
  const activeOrder = relevantOrders.find((order) => order.id === orderId) || relevantOrders[0];
  const riderThread = messages.filter((item) => (activeOrder ? item.orderId === activeOrder.id : true));

  const handleSendFarmer = () => {
    if (!farmerInput.trim()) return;
    sendDirectMessage(activeSeller.id, activeSeller.name, farmerInput.trim());
    setFarmerInput('');
  };

  const handleSendRider = () => {
    if (!user || !activeOrder || !riderBody.trim()) return;
    const toBuyer = hasRole('delivery') || hasRole('admin');
    const phone = toBuyer ? activeOrder.buyerPhone : user.phone;
    const sent = sendSms({
      orderId: activeOrder.id,
      fromRole: toBuyer ? 'delivery' : 'buyer',
      fromName: `${user.firstName} ${user.lastName}`,
      fromUserId: user.id,
      toUserId: toBuyer ? activeOrder.userId : activeOrder.driverId || 4,
      phone,
      body: riderBody.trim(),
    });
    setNotice(phone ? `SMS ${sent.status} to ${phone}` : 'Saved in-app. Add a mobile number for carrier SMS.');
    setRiderBody('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Title */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>AgriChat & Messaging</Text>
            <Text style={styles.headerSub}>Direct contact with farmers, riders, & AgriKaibigan AI</Text>
          </View>
          <TouchableOpacity
            style={styles.aiBadgeBtn}
            onPress={() => setShowAiModal(true)}
          >
            <Ionicons name="sparkles" size={16} color="#15803d" />
            <Text style={styles.aiBadgeBtnText}>Ask AI</Text>
          </TouchableOpacity>
        </View>

        {/* Shopee-Style Top Tab Selector */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'farmers' && styles.tabBtnActive]}
            onPress={() => setActiveTab('farmers')}
          >
            <Ionicons
              name="storefront"
              size={18}
              color={activeTab === 'farmers' ? '#15803d' : '#64748b'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'farmers' && styles.tabBtnTextActive]}>
              🌾 Farmer Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'riders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('riders')}
          >
            <Ionicons
              name="bicycle"
              size={18}
              color={activeTab === 'riders' ? '#15803d' : '#64748b'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'riders' && styles.tabBtnTextActive]}>
              🚚 Rider Updates
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: FARMER DIRECT CHAT */}
        {activeTab === 'farmers' && (
          <View style={styles.tabContent}>
            {/* Horizontal Farmer Stalls Selector */}
            <View style={styles.sellerSelectorContainer}>
              <Text style={styles.sectionMiniTitle}>SELECT FARM STALL:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sellersScroll}
              >
                {sellers.map((seller) => {
                  const isSelected = seller.id === activeSeller.id;
                  return (
                    <TouchableOpacity
                      key={seller.id}
                      style={[styles.sellerChip, isSelected && styles.sellerChipActive]}
                      onPress={() => setSelectedSellerId(seller.id)}
                    >
                      <View style={[styles.onlineDot, { backgroundColor: '#22c55e' }]} />
                      <Text
                        style={[styles.sellerChipText, isSelected && styles.sellerChipTextActive]}
                        numberOfLines={1}
                      >
                        {seller.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Active Stall Info Bar */}
            <View style={styles.activeStallBanner}>
              <View style={styles.stallAvatar}>
                <Text style={styles.stallAvatarText}>{activeSeller.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.activeStallName}>{activeSeller.name}</Text>
                  <View style={styles.prefBadge}>
                    <Text style={styles.prefBadgeText}>Preferred</Text>
                  </View>
                </View>
                <Text style={styles.activeStallLoc}>📍 {activeSeller.location} · ⭐ {activeSeller.rating} Rating</Text>
              </View>
              <View style={styles.replyBadge}>
                <Text style={styles.replyBadgeText}>⚡ Replies in mins</Text>
              </View>
            </View>

            {/* Messages Thread */}
            <ScrollView
              style={styles.chatThread}
              contentContainerStyle={styles.chatThreadContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.chatNoticeBox}>
                <Ionicons name="shield-checkmark" size={16} color="#15803d" />
                <Text style={styles.chatNoticeText}>
                  AgriMarket Protected Chat: Inquire about harvest dates, wholesale crates, and quality guarantees directly with the farm.
                </Text>
              </View>

              {stallThread.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[styles.messageBubbleWrapper, isUser ? styles.msgRight : styles.msgLeft]}
                  >
                    {!isUser && (
                      <View style={styles.msgAvatarMini}>
                        <Text style={styles.msgAvatarMiniText}>{activeSeller.name[0]}</Text>
                      </View>
                    )}
                    <View style={[styles.messageBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleSeller]}>
                      <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
                        {msg.text}
                      </Text>
                      <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
                        {msg.timestamp}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Quick Prompt Inquiry Pills */}
            <View style={styles.quickInquiriesRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
                {QUICK_FARMER_INQUIRIES.map((pill, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickInquiryPill}
                    onPress={() => {
                      sendDirectMessage(activeSeller.id, activeSeller.name, pill);
                    }}
                  >
                    <Text style={styles.quickInquiryPillText}>{pill}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder={`Ask ${activeSeller.name.split(' ')[0]} about fresh harvests...`}
                placeholderTextColor="#94a3b8"
                value={farmerInput}
                onChangeText={setFarmerInput}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !farmerInput.trim() && styles.sendBtnDisabled]}
                onPress={handleSendFarmer}
                disabled={!farmerInput.trim()}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 2: RIDER UPDATES */}
        {activeTab === 'riders' && (
          <View style={styles.tabContent}>
            {!isAuthenticated ? (
              <View style={styles.emptyState}>
                <Ionicons name="lock-closed" size={44} color="#94a3b8" />
                <Text style={styles.emptyStateTitle}>Sign In for Delivery SMS</Text>
                <Text style={styles.emptyStateText}>
                  Log in to track your assigned delivery rider and send real-time drop-off updates.
                </Text>
              </View>
            ) : (
              <>
                {/* Orders Selector */}
                <View style={styles.sellerSelectorContainer}>
                  <Text style={styles.sectionMiniTitle}>SELECT ACTIVE DELIVERY ORDER:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sellersScroll}
                  >
                    {relevantOrders.map((order) => {
                      const isSel = activeOrder?.id === order.id;
                      return (
                        <TouchableOpacity
                          key={order.id}
                          style={[styles.sellerChip, isSel && styles.sellerChipActive]}
                          onPress={() => setOrderId(order.id)}
                        >
                          <Text style={[styles.sellerChipText, isSel && styles.sellerChipTextActive]}>
                            {order.id} · {order.status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {activeOrder && (
                  <View style={styles.activeOrderCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.orderCardBuyer}>{activeOrder.buyerName}</Text>
                      <Text style={styles.orderCardPhone}>{activeOrder.buyerPhone || 'No phone set'}</Text>
                    </View>
                    <Text style={styles.orderCardAddr}>📍 {activeOrder.address}</Text>
                  </View>
                )}

                {/* SMS Thread */}
                <ScrollView
                  style={styles.chatThread}
                  contentContainerStyle={styles.chatThreadContent}
                >
                  {riderThread.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.bubble,
                        item.fromRole === 'delivery' ? styles.deliveryBubble : styles.buyerBubble,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.bubbleSender}>{item.fromName} ({item.fromRole})</Text>
                        <Text style={styles.bubbleStatus}>{item.channel} · {item.status}</Text>
                      </View>
                      <Text style={styles.bubbleBody}>{item.body}</Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Rider Input */}
                <View style={styles.inputBar}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Text delivery courier..."
                    placeholderTextColor="#94a3b8"
                    value={riderBody}
                    onChangeText={setRiderBody}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, !riderBody.trim() && styles.sendBtnDisabled]}
                    onPress={handleSendRider}
                    disabled={!riderBody.trim()}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                {!!notice && <Text style={styles.noticeText}>{notice}</Text>}
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Embedded AgriKaibigan AI Modal */}
      <AiAssistantModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
      />
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
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  aiBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiBadgeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  tabBtnActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },
  tabContent: {
    flex: 1,
  },
  sellerSelectorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionMiniTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94a3b8',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sellersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sellerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sellerChipActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  sellerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  sellerChipTextActive: {
    color: '#fff',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeStallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stallAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803d',
  },
  activeStallName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  prefBadge: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  prefBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  activeStallLoc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  replyBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  replyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  chatNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  chatNoticeText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 15,
  },
  chatThread: {
    flex: 1,
  },
  chatThreadContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    maxWidth: '85%',
  },
  msgRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  msgLeft: {
    alignSelf: 'flex-start',
  },
  msgAvatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  msgAvatarMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  msgBubbleUser: {
    backgroundColor: '#15803d',
    borderBottomRightRadius: 4,
  },
  msgBubbleSeller: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 18,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeUser: {
    color: '#bbf7d0',
  },
  quickInquiriesRow: {
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  quickInquiryPill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  quickInquiryPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  activeOrderCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  orderCardBuyer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  orderCardPhone: {
    fontSize: 12,
    color: '#64748b',
  },
  orderCardAddr: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  bubble: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  deliveryBubble: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  buyerBubble: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  bubbleStatus: {
    fontSize: 10,
    color: '#64748b',
  },
  bubbleBody: {
    fontSize: 13,
    color: '#334155',
  },
  noticeText: {
    fontSize: 11,
    color: '#15803d',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#dcfce7',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
