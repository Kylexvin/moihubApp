// screens/ai/AIChatMainScreen.js
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
  StatusBar,
  Dimensions,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { renderAIMessage } from './components';

const { width } = Dimensions.get('window');

// ─── Theme Colors ────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#f5f5f5',
  surface: '#ffffff',
  surfaceAlt: '#f8f9fa',
  headerBg: '#2C3E50',
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
  shadow: '#000000',
};

const AIChatMainScreen = () => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const flatListRef = useRef(null);

  // ─── Quick Chips ──────────────────────────────────────────────────────────
  const quickChips = [
    { label: '🏠 Rentals', value: 'rentals' },
    { label: '🍔 Food', value: 'food' },
    { label: '🔧 Services', value: 'services' },
    { label: '🛍️ Marketplace', value: 'marketplace' },
    { label: '🛒 Eshop', value: 'eshops' },
  ];

  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        text: "👋 Hi! I'm your MoiHub Assistant.\n\nI can help you with:\n🏠 Rentals\n🍔 Food\n🔧 Services\n🛍️ Marketplace\n\nJust tell me what you're looking for!",
        module: null,
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
      const payload = {
        message: messageToSend,
        userId: 'temp-user-id',
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
        module: response.data.module || null,
        data: response.data.data || null,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorText = '😅 Sorry, something went wrong. Please try again.';
      if (error.response?.status === 404) {
        errorText = 'Sorry, that feature is not available yet. Try asking about rentals! 🏠';
      } else if (error.response?.status === 400) {
        errorText = 'Please enter a valid message. What would you like to find? 🤔';
      }

      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: errorText,
        module: null,
        data: null,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Navigation Handlers ──────────────────────────────────────────────────
  const handleViewRentalDetails = (rental) => {
    navigation.navigate('AccomStack', {
      screen: 'RentalDetail',
      params: { rentalId: rental.id },
    });
  };

  const handleViewServiceDetails = (provider) => {
    if (provider.hasDashboard) {
      navigation.navigate('ServiceDashboard', {
        screen: 'ProviderDashboard',
        params: { providerId: provider.id },
      });
    } else {
      navigation.navigate('ServiceStack', {
        screen: 'ServiceDetail',
        params: { providerId: provider.id },
      });
    }
  };

  const handleViewFoodDetails = (vendor) => {
    navigation.navigate('FoodStack', {
      screen: 'FoodDetail',
      params: { vendorId: vendor.id },
    });
  };

  const handleViewMarketplace = () => {
    navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' });
  };

  // ─── Combined View More Handler ──────────────────────────────────────────
  const handleViewMore = (type) => {
    switch(type) {
      case 'rentals':
        navigation.navigate('AccomStack', { screen: 'AccomHome' });
        break;
      case 'marketplace':
        navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' });
        break;
      case 'eshops':
        navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
        break;
      case 'food':
        navigation.navigate('FoodStack', { screen: 'FoodHome' });
        break;
      case 'services':
        navigation.navigate('ServiceStack', { screen: 'ServiceHome' });
        break;
      default:
        break;
    }
  };

  // ─── Eshop Handlers ──────────────────────────────────────────────────────
  const handleViewShopProducts = (shop) => {
    navigation.navigate('EshopNavigator', {
      screen: 'ShopProducts',
      params: {
        shopSlug: shop.slug,
        shopName: shop.shopName,
        shopId: shop.id,
      },
    });
  };

  // ─── Unified onViewDetails handler ──────────────────────────────────────
  const handleViewDetails = (item, type) => {
    if (type === 'eshop') {
      handleViewShopProducts(item);
      return;
    }

    if (type === 'product') {
      navigation.navigate('EshopNavigator', {
        screen: 'ProductDetail',
        params: { productId: item.id, shopId: item.shopId },
      });
      return;
    }

    if (type === 'dashboard') {
      navigation.navigate('ServiceDashboard', {
        screen: 'ProviderDashboard',
        params: { providerId: item.id },
      });
      return;
    }

    // Auto-detect by item properties
    if (item.price && item.location && item.type) {
      handleViewRentalDetails(item);
    } else if (item.category || item.providerType) {
      handleViewServiceDetails(item);
    } else if (item.shopName || item.matchedItems) {
      handleViewFoodDetails(item);
    } else {
      navigation.navigate('DetailScreen', { id: item.id });
    }
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // ─── Render Message ──────────────────────────────────────────────────────
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageWrapper, isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper]}>
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
          <Text style={{ fontSize: 10, color: COLORS.textMeta, marginTop: 4, alignSelf: 'flex-end' }}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!loading) return null;

    return (
      <View style={[styles.messageWrapper, styles.assistantMessageWrapper]}>
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

  // ─── Render AI Components ─────────────────────────────────────────────────
const renderAIComponents = ({ item }) => {
  if (item.role === 'user' || !item.data) return null;

  return (
    <View style={{ marginTop: 4, marginLeft: 42 }}>
      {renderAIMessage(item, handleViewDetails, handleCall, handleViewMore)}
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerLogo}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>MoiHub Assistant</Text>
            <Text style={styles.headerSub}>● Online</Text>
          </View>
        </View>
        <TouchableOpacity style={{ padding: 8 }}>
          <Ionicons name="ellipsis-vertical" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ─── Messages ──────────────────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            {renderMessage({ item })}
            {renderAIComponents({ item })}
          </View>
        )}
        ListFooterComponent={renderTypingIndicator}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      {/* ─── Quick Chips ───────────────────────────────────────────────────── */}
      {messages.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          {quickChips.map((chip) => (
            <TouchableOpacity
              key={chip.value}
              style={styles.chip}
              onPress={() => sendMessage(chip.label)}
            >
              <Text style={styles.chipText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ─── Input ────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask MoiHub anything..."
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
    flex: 1,
  },
  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
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
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 4,
  },

  // ── Message rows ──────────────────────────────────────────────────────────────
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
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
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
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

  // ── Quick Chips ──────────────────────────────────────────────────────────────
  chipsContainer: {
    maxHeight: 52,
    marginBottom: 4,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.green,
  },

  // ── Input ─────────────────────────────────────────────────────────────────────
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

export default AIChatMainScreen;