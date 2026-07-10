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

const COLORS = {
  bg: '#f5f5f5',
  surface: '#ffffff',
  surfaceAlt: '#f8f9fa',
  inputBg: '#f0f0f0',
  green: '#059669',
  greenLight: '#E8F5E9',
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMeta: '#888888',
  border: '#e0e0e0',
  borderLight: '#e8e8e8',
  userBubble: '#E3F2FD',
  userBubbleBorder: '#BBDEFB',
  white: '#ffffff',
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
    // ─── Build module-specific system prompt ──────────────────────────────
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
      systemPrompt: moduleSystemPrompt,  // ← ADD THIS
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
              <View style={styles.avatarImage}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
            </View>
          )}
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {item.text}
            </Text>
            <Text style={styles.timeText}>
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
          <View style={styles.avatarImage}>
            <Text style={{ fontSize: 16 }}>🤖</Text>
          </View>
        </View>
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, { animationDelay: '0s' }]} />
            <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
            <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
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
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.greenLight,
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
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.userBubbleBorder,
  },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
    includeFontPadding: false,
  },
  userText: {
    color: COLORS.textPrimary,
  },
  assistantText: {
    color: COLORS.textPrimary,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMeta,
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
    backgroundColor: COLORS.green,
  },
  componentWrapper: {
    marginTop: 4,
    marginLeft: 36,
  },
  inputContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 10,
    maxHeight: 120,
    includeFontPadding: false,
    lineHeight: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.borderLight,
  },
});

export default AIModuleChat;