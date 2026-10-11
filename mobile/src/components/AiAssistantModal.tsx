import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileApi from '../services/api';

const GEMINI_KEY_STORAGE = 'agrimarket_gemini_api_key';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: 'gemini' | 'knowledge-base';
  model?: string;
  tips?: string[];
  time: string;
};

const SUGGESTED_QUESTIONS = [
  '🌾 Best crops to plant this season in SOCCSKSARGEN?',
  '🐛 Natural formula for tomato blight & caterpillars?',
  '💰 Today’s fair farmgate prices for rice and mangoes?',
  '🌿 How to make vermicompost from farm waste?',
  '🍲 Traditional sinigang recipe with Lake Sebu tilapia?',
  '✨ Can you answer any universal science or math question?',
];

export default function AiAssistantModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text:
        '👋 **Kumusta! Ako si AgriKaibigan AI**, your world-class agricultural and universal assistant!\n\n' +
        'Powered by Google Gemini and SOCCSKSARGEN agricultural intelligence. Ask me anything about farming, prices, pest control, recipes, or ANY general question in English, Tagalog, or Bisaya!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'knowledge-base',
      tips: [
        'Ask in English, Tagalog, or Bisaya',
        'Tap any suggested prompt below for fast answers',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'tl' | 'ceb'>('en');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(GEMINI_KEY_STORAGE).then((key) => {
      if (key) {
        setSavedKey(key);
        setApiKey(key);
      }
    });
  }, []);

  const saveKey = async () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      await AsyncStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
      setSavedKey(trimmed);
      Alert.alert('Success', 'Google Gemini API key saved! Universal AI mode is now active.');
    } else {
      await AsyncStorage.removeItem(GEMINI_KEY_STORAGE);
      setSavedKey(null);
      Alert.alert('Cleared', 'Custom API key removed. Using default backend engine.');
    }
    setShowKeyModal(false);
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text }],
        }));

      const res = await mobileApi.post<any>('/ai/agri-chat', {
        message: query,
        language,
        history,
        apiKey: savedKey || undefined,
      });

      const replyData = res?.data || res;
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyData?.reply || 'I am ready to help with your harvest and marketplace questions!',
        source: replyData?.source || (savedKey ? 'gemini' : 'knowledge-base'),
        model: replyData?.model || (savedKey ? 'gemini-1.5-flash' : 'expert-knowledge-base'),
        tips: replyData?.helpfulTips || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Fallback offline message
      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text:
          '🌱 **AgriKaibigan AI Tip:**\n\n' +
          'For healthy harvests in SOCCSKSARGEN, practice regular crop rotation, maintain soil moisture using vermicast, and monitor daily wholesale prices. Tap the settings gear above to configure your FREE Google Gemini API key from https://aistudio.google.com/ for full universal answers!',
        source: 'knowledge-base',
        model: 'offline-mode',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.botAvatar}>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AgriKaibigan AI</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.statusDot, { backgroundColor: savedKey ? '#10b981' : '#f59e0b' }]} />
                <Text style={styles.headerSubtitle}>
                  {savedKey ? 'Gemini 1.5 Flash (Free API Active)' : 'Universal Agronomy AI'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowKeyModal(true)}>
              <Ionicons name="key-outline" size={20} color="#15803d" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language selector chips */}
        <View style={styles.langBar}>
          <Text style={styles.langLabel}>Language:</Text>
          {(['en', 'tl', 'ceb'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[styles.langChip, language === lang && styles.langChipActive]}
            >
              <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                {lang === 'en' ? 'English' : lang === 'tl' ? 'Tagalog' : 'Bisaya'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Messages List */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageBubble,
                m.sender === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {m.sender === 'ai' && (
                <View style={styles.aiBubbleHeader}>
                  <Ionicons name="leaf" size={14} color="#15803d" />
                  <Text style={styles.aiLabel}>AgriKaibigan AI</Text>
                  {m.source === 'gemini' && (
                    <View style={styles.geminiBadge}>
                      <Text style={styles.geminiBadgeText}>⚡ Gemini Flash</Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={[styles.bubbleText, m.sender === 'user' ? styles.userText : styles.aiText]}>
                {m.text}
              </Text>

              {m.tips && m.tips.length > 0 && (
                <View style={styles.tipsBox}>
                  {m.tips.map((tip, idx) => (
                    <Text key={idx} style={styles.tipItem}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}

              <Text style={[styles.bubbleTime, m.sender === 'user' ? styles.userTime : styles.aiTime]}>
                {m.time}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingText}>AgriKaibigan is thinking...</Text>
            </View>
          )}

          {/* Quick Prompts Bar */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>💡 Quick Prompts:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(q)}
                >
                  <Text style={styles.suggestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about crops, pests, prices, or anything..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={600}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            disabled={!input.trim() || loading}
            onPress={() => sendMessage()}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Free Gemini API Key Settings Sub-Modal */}
        <Modal visible={showKeyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.keyModalCard}>
              <View style={styles.keyModalHeader}>
                <Ionicons name="key" size={24} color="#16a34a" />
                <Text style={styles.keyModalTitle}>Free Gemini API Key</Text>
              </View>
              <Text style={styles.keyModalSubtitle}>
                Get an unlimited FREE API key from Google AI Studio (aistudio.google.com) to empower the chatbot to answer ANY question worldwide!
              </Text>
              <TextInput
                style={styles.keyInput}
                placeholder="AIzaSy..."
                placeholderTextColor="#9ca3af"
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.keyModalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowKeyModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={saveKey}>
                  <Text style={styles.modalSaveText}>Save Key</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  headerSubtitle: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  langLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  langChipActive: { backgroundColor: '#15803d' },
  langText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
  langTextActive: { color: '#fff' },
  messageList: { flex: 1 },
  messageContent: { padding: 16, paddingBottom: 20 },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  userBubble: {
    backgroundColor: '#15803d',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiLabel: { fontSize: 12, fontWeight: '700', color: '#15803d' },
  geminiBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  geminiBadgeText: { fontSize: 10, fontWeight: '700', color: '#1d4ed8' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#ffffff' },
  aiText: { color: '#1f2937' },
  tipsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  tipItem: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  bubbleTime: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  userTime: { color: '#bbf7d0' },
  aiTime: { color: '#9ca3af' },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#6b7280', fontSize: 14, fontStyle: 'italic' },
  suggestionsContainer: { marginTop: 12, marginBottom: 8 },
  suggestionsTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  suggestionsScroll: { flexDirection: 'row' },
  suggestionChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    elevation: 1,
  },
  suggestionText: { color: '#065f46', fontSize: 13, fontWeight: '600' },
  inputBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#9ca3af' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyModalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  keyModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  keyModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  keyModalSubtitle: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 16 },
  keyInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  keyModalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  modalCancelText: { color: '#6b7280', fontWeight: '600' },
  modalSaveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
