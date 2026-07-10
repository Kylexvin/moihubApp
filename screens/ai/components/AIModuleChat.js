// screens/ai/components/AIModuleChat.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { renderAIMessage } from './index';

const { width } = Dimensions.get('window');

// ─── Module Themes ──────────────────────────────────────────────────────────
const MODULE_THEMES = {
  eshops: {
    primary: '#6B4EFF',
    secondary: '#9F7AEA',
    accent: '#FFD700',
    bg: '#0A0A0F',
    surface: '#1A1A2E',
    card: '#26264D',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0B0FF',
    textMeta: '#9F8BB3',
    border: '#3D3D6B',
    userBubble: '#26264D',
    userBubbleBorder: '#3D3D6B',
    green: '#FFD700',
    greenLight: '#3D3D6B',
    inputBg: '#1A1A2E',
    headerBg: '#0A0A0F',
  },
  food: {
    primary: '#E53935',
    secondary: '#FF8A80',
    accent: '#FF6F00',
    bg: '#1A0A0A',
    surface: '#2D1A1A',
    card: '#3D2626',
    textPrimary: '#FFFFFF',
    textSecondary: '#FFCDD2',
    textMeta: '#9F8B8B',
    border: '#4D3D3D',
    userBubble: '#3D2626',
    userBubbleBorder: '#4D3D3D',
    green: '#FF6F00',
    greenLight: '#4D3D3D',
    inputBg: '#2D1A1A',
    headerBg: '#1A0A0A',
  },
  rentals: {
    primary: '#1A73E8',
    secondary: '#64B5F6',
    accent: '#FFD700',
    bg: '#0A0F1A',
    surface: '#1A1F2D',
    card: '#262F3D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0C4DE',
    textMeta: '#8B9DB3',
    border: '#3D4D6B',
    userBubble: '#262F3D',
    userBubbleBorder: '#3D4D6B',
    green: '#FFD700',
    greenLight: '#3D4D6B',
    inputBg: '#1A1F2D',
    headerBg: '#0A0F1A',
  },
  services: {
    primary: '#2E7D32',
    secondary: '#66BB6A',
    accent: '#FF6F00',
    bg: '#0A1A0A',
    surface: '#1A2D1A',
    card: '#263D26',
    textPrimary: '#FFFFFF',
    textSecondary: '#C8E6C9',
    textMeta: '#8B9F8B',
    border: '#3D4D3D',
    userBubble: '#263D26',
    userBubbleBorder: '#3D4D3D',
    green: '#FF6F00',
    greenLight: '#3D4D3D',
    inputBg: '#1A2D1A',
    headerBg: '#0A1A0A',
  },
  marketplace: {
    primary: '#D4A017',
    secondary: '#F4D03F',
    accent: '#1A73E8',
    bg: '#1A170A',
    surface: '#2D2A1A',
    card: '#3D3A26',
    textPrimary: '#FFFFFF',
    textSecondary: '#F0E68C',
    textMeta: '#9F9B8B',
    border: '#4D4A3D',
    userBubble: '#3D3A26',
    userBubbleBorder: '#4D4A3D',
    green: '#1A73E8',
    greenLight: '#4D4A3D',
    inputBg: '#2D2A1A',
    headerBg: '#1A170A',
  },
  default: {
    primary: '#059669',
    secondary: '#34D399',
    accent: '#10B981',
    bg: '#0f1412',
    surface: '#1a221e',
    card: '#26302b',
    textPrimary: '#f0f0f0',
    textSecondary: '#c4c9c6',
    textMeta: '#6b7570',
    border: '#26302b',
    userBubble: '#14332a',
    userBubbleBorder: '#1d4a3b',
    green: '#10B981',
    greenLight: '#14332a',
    inputBg: '#1a221e',
    headerBg: '#0f1412',
  },
};

const AIModuleChat = ({
  module,
  placeholder,
  navigation,
  onViewDetails,
  onCall,
  onViewMore,
  initialMessage,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const flatListRef = useRef(null);

  // ─── Get theme based on module ──────────────────────────────────────────
  const COLORS = MODULE_THEMES[module] || MODULE_THEMES.default;

  const moduleNames = {
    eshops: 'Eshop Assistant',
    food: 'Food Assistant',
    rentals: 'Rental Assistant',
    services: 'Service Assistant',
    marketplace: 'Marketplace Assistant',
  };

  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        text: initialMessage || `👋 Hi! I'm your ${moduleNames[module] || 'AI'}.\n\nAsk me anything about ${module}!`,
        data: null,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const sendMessage = async (text) => {
    const messageToSend = text || inputText.trim();
    if (!messageToSend || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const moduleSystemPrompt = module ? `You are an AI assistant for the ${module} module ONLY.

CRITICAL RULES:
1. If user says "${module}", "shops", "stores" — call searchEshops IMMEDIATELY with empty arguments {}.
2. If user asks about ANY specific product — call searchEshopProducts IMMEDIATELY with that word.
3. NEVER respond with "Please specify" — ALWAYS call a tool first.

Keyword mapping for ${module}:
- "${module}" → searchEshops({})
- "shops" → searchEshops({})
- "stores" → searchEshops({})
- Any product name → searchEshopProducts({ name: "product" })

You can ONLY help with ${module} related queries.
If the user asks about anything outside ${module}, politely say:
"Sorry, I can only help with ${module} related questions. Please ask me about products, shops, or orders."` : null;

      const payload = {
        message: messageToSend,
        userId: 'temp-user-id',
        module: module,
        systemPrompt: moduleSystemPrompt,
      };

      if (sessionId) {
        payload.sessionId = sessionId;
      }

      const response = await axios.post('/api/ai/chat', payload);

      if (response.data.sessionId) {
        setSessionId(response.data.sessionId);
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.data.message || 'Sorry, I could not process your request.',
        data: response.data.data || null,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: '😅 Sorry, something went wrong. Please try again.',
        data: null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View>
        <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
          {!isUser && (
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarImage, { backgroundColor: COLORS.greenLight }]}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
            </View>
          )}
          <View style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            isUser ? { backgroundColor: COLORS.userBubble, borderColor: COLORS.userBubbleBorder } : { backgroundColor: COLORS.surface, borderColor: COLORS.border }
          ]}>
            <Text style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
              isUser ? { color: COLORS.textPrimary } : { color: COLORS.textPrimary }
            ]}>
              {item.text}
            </Text>
            <Text style={[styles.timeText, { color: COLORS.textMeta }]}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {!isUser && item.data && (
          <View style={styles.componentWrapper}>
            {renderAIMessage(item, onViewDetails, onCall, onViewMore)}
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!loading) return null;

    return (
      <View style={[styles.messageWrapper, styles.assistantWrapper]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarImage, { backgroundColor: COLORS.greenLight }]}>
            <Text style={{ fontSize: 16 }}>🤖</Text>
          </View>
        </View>
        <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, { backgroundColor: COLORS.green }]} />
            <View style={[styles.typingDot, { backgroundColor: COLORS.green }]} />
            <View style={[styles.typingDot, { backgroundColor: COLORS.green }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        ListFooterComponent={renderTypingIndicator}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: COLORS.bg, borderTopColor: COLORS.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: COLORS.surface, borderColor: COLORS.borderLight }]}>
            <TextInput
              style={[styles.input, { color: COLORS.textPrimary }]}
              placeholder={placeholder || `Ask about ${module}...`}
              placeholderTextColor={COLORS.textMeta}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  assistantWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 2,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: width * 0.78,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 5,
    borderWidth: 1,
  },
  assistantBubble: {
    borderBottomLeftRadius: 5,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
    includeFontPadding: false,
  },
  userText: {},
  assistantText: {},
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  componentWrapper: {
    marginTop: 4,
    marginLeft: 36,
  },
  inputContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    maxHeight: 120,
    includeFontPadding: false,
    lineHeight: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
});

export default AIModuleChat;