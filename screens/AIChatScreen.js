import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const { width } = Dimensions.get('window');

// ─── Design tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#080f0a',
  surface: '#111a13',
  surfaceAlt: '#162019',
  border: '#1e2e21',
  borderLight: '#243428',
  green: '#1db954',
  greenDim: '#16a34a',
  greenMuted: '#14532d',
  greenGlow: 'rgba(29,185,84,0.12)',
  textPrimary: '#e8f5ea',
  textSecondary: '#7a9e82',
  textMuted: '#4a6b52',
  userBubble: '#14532d',
  userBubbleBorder: '#1a6b38',
  white: '#ffffff',
};

const AIChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  // Typing dots animation
  useEffect(() => {
    if (!isTyping) return;
    const animateDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      ).start();
    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hey! 👋 I'm Rada — your Moi University service finder.\n\nTry: \"boda boda near main gate\" or \"cheap kinyozi in hostel\"",
        },
      ]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // ─── Core send logic (shared by input and suggestions) ──────────────────────
  const sendMessageWithText = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await axios.post('/api/services/ai-chat', { query: text });
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message || 'I found some services for you.',
        cards: response.data.cards || [],
        suggestions: response.data.suggestions || [],
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const sendMessage = () => sendMessageWithText(inputText.trim());

  const handleSuggestion = (text) => sendMessageWithText(text);

  const handleCall = (phone) => {
    if (!phone) return;
    const clean = phone.replace(/\s+/g, '');
    const formatted = clean.startsWith('+') ? clean : `+${clean}`;
    Linking.openURL(`tel:${formatted}`).catch(() =>
      Alert.alert('Error', 'Could not make phone call')
    );
  };

  const getBadgeColor = (score) => {
    if (score >= 85) return COLORS.green;
    if (score >= 70) return '#2e7d4f';
    if (score >= 55) return '#4a7c59';
    return COLORS.textMuted;
  };

  // ─── Provider Card ───────────────────────────────────────────────────────────
  const renderProviderCard = (card, index) => {
    if (!card) return null;
    return (
      <TouchableOpacity
        key={index}
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => {
          if (card.hasDashboard) {
            navigation.navigate('ProviderProfile', {
              providerId: card.providerId,
              providerName: card.name,
              providerType: 'dashboard',
              providerPhone: card.phone,
              providerAddress: card.quickInfo?.address || card.locations?.[0],
            });
          }
        }}
      >
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
            {card.badge && (
              <View style={[styles.cardBadge, { backgroundColor: getBadgeColor(card.matchScore) }]}>
                <Text style={styles.cardBadgeText}>{card.badge}</Text>
              </View>
            )}
          </View>
          {card.matchScore != null && (
            <Text style={styles.cardScore}>{card.matchScore}%</Text>
          )}
        </View>

        {/* Card details */}
        <View style={styles.cardDetails}>
          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.cardDetailText} numberOfLines={1}>
              {card.quickInfo?.address || card.locations?.[0] || 'Location not specified'}
            </Text>
          </View>
          {card.rating > 0 && (
            <View style={styles.cardRow}>
              <Ionicons name="star" size={13} color="#f59e0b" />
              <Text style={styles.cardDetailText}>
                {card.rating.toFixed(1)} ({card.totalReviews} reviews)
              </Text>
            </View>
          )}
          <View style={styles.cardRow}>
            <Ionicons name="call-outline" size={13} color={COLORS.green} />
            <Text style={[styles.cardDetailText, { color: COLORS.green }]}>{card.phone}</Text>
          </View>
        </View>

        {/* Card actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cardBtnPrimary}
            onPress={() => handleCall(card.phone)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={15} color={COLORS.white} />
            <Text style={styles.cardBtnPrimaryText}>Call</Text>
          </TouchableOpacity>
          {card.hasDashboard && (
            <TouchableOpacity
              style={styles.cardBtnSecondary}
              onPress={() =>
                navigation.navigate('ProviderProfile', {
                  providerId: card.providerId,
                  providerName: card.name,
                  providerType: 'dashboard',
                  providerPhone: card.phone,
                  providerAddress: card.quickInfo?.address || card.locations?.[0],
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={15} color={COLORS.green} />
              <Text style={styles.cardBtnSecondaryText}>View</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Message bubble ──────────────────────────────────────────────────────────
  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    const hasCards = message.cards && message.cards.length > 0;

    return (
      <View
        key={message.id}
        style={[
          styles.messageWrapper,
          isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Image
              source={require('../assets/moihublogo.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
          ]}>
            {message.content}
          </Text>

          {hasCards && (
            <View style={styles.cardsContainer}>
              {message.cards.map((card, idx) => renderProviderCard(card, idx))}
            </View>
          )}

          {message.suggestions && message.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {message.suggestions.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                  <Ionicons name="arrow-forward" size={11} color={COLORS.green} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={require('../assets/moihublogo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSub}>Powered by Rada</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Messages */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={[styles.messagesContainer, { opacity: fadeAnim }]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {messages.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Image
              source={require('../assets/moihublogo.png')}
              style={styles.emptyLogo}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>What do you need?</Text>
            <Text style={styles.emptySubtitle}>
              Find services around Moi University — transport, laundry, barbers, food and more.
            </Text>
          </View>
        )}

        {messages.map(renderMessage)}

        {isTyping && (
          <View style={[styles.messageWrapper, styles.assistantMessageWrapper]}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../assets/moihublogo.png')}
                style={styles.avatarImage}
                resizeMode="contain"
              />
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.typingIndicator}>
                <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
                <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
                <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
              </View>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Ionicons name="arrow-up" size={20} color={COLORS.white} />
              }
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

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.green,
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // ── Messages ─────────────────────────────────────────────────────────────────
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 4,
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  emptyLogo: {
    width: 72,
    height: 72,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Message rows ──────────────────────────────────────────────────────────────
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  assistantMessageWrapper: {
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
  },

  // ── Bubbles ───────────────────────────────────────────────────────────────────
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
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  userText: {
    color: COLORS.textPrimary,
  },
  assistantText: {
    color: COLORS.textPrimary,
  },

  // ── Typing dots ───────────────────────────────────────────────────────────────
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

  // ── Provider cards ────────────────────────────────────────────────────────────
  cardsContainer: {
    marginTop: 12,
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginRight: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  cardBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  cardScore: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  cardDetails: {
    gap: 5,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    includeFontPadding: false,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: COLORS.green,
  },
  cardBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  cardBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  cardBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.green,
    letterSpacing: 0.2,
  },

  // ── Suggestions ───────────────────────────────────────────────────────────────
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: COLORS.greenGlow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.greenMuted,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    letterSpacing: 0.1,
  },

  // ── Input ─────────────────────────────────────────────────────────────────────
  inputContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
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

export default AIChatScreen;