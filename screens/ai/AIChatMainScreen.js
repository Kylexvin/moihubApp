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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { renderAIMessage } from './components';
import AnimatedMessage from './components/AnimatedMessage';

const { width } = Dimensions.get('window');

// ─── Theme Colors ────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#0f1412',
  surface: '#1a221e',
  surfaceAlt: '#161c19',
  headerBg: '#0f1412',
  inputBg: '#1a221e',
  green: '#10B981',
  greenLight: '#14332a',
  textPrimary: '#f0f0f0',
  textSecondary: '#c4c9c6',
  textMeta: '#6b7570',
  border: '#26302b',
  borderLight: '#2c3630',
  userBubble: '#14332a',
  userBubbleBorder: '#1d4a3b',
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

  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        text: "Hi! I'm your MoiHub Assistant. 👋\n\nI can help you with:\nRentals | Food | Services\nMarketplace | Eshops | Roommate\n\nJust tell me exactly what you're looking for!",
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

      let errorText = '🤦‍♂️ Sorry, kuna shida mahali. Please try again.';
      
      if (error.response?.status === 429) {
        errorText = '⏳ Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 503) {
        errorText = '🔧 The AI service is currently busy. Please try again in a few seconds.';
      } else if (error.response?.status === 404) {
        errorText = 'Sorry, that feature is not available yet. Try asking about rentals.';
      } else if (error.response?.status === 400) {
        errorText = 'Please enter a valid message. What would you like to find?';
      } else if (error.response?.status === 500) {
        errorText = '⚠️ Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorText = '⏱️ Request timed out. Please check your connection and try again.';
      } else if (error.message?.includes('Network Error')) {
        errorText = '📡 Network error. Please check your internet connection.';
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

  const handleViewServiceDetails = (provider, type) => {
    if (type === 'dashboard' || provider.hasDashboard) {
      navigation.navigate('ServicesStack', {
        screen: 'ServiceProviderDashboard',
        params: { providerId: provider.id },
      });
    } else {
      navigation.navigate('ServicesStack', {
        screen: 'ProviderProfile',
        params: { providerId: provider.id },
      });
    }
  };

  const handleViewFoodDetails = (vendor) => {
    navigation.navigate('FoodStack', {
      screen: 'FoodVendor',  
      params: { vendorId: vendor.id },
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
      navigation.navigate('ServicesStack', {
        screen: 'ProviderProfile',
        params: { providerId: item.id },
      });
      return;
    }

    if (type === 'service') {
      navigation.navigate('ServicesStack', {
        screen: 'ProviderProfile',
        params: { providerId: item.id },
      });
      return;
    }

    // Auto-detect by item properties
    if (item.price && item.location && item.type) {
      handleViewRentalDetails(item);
    } else if (item.category || item.providerType) {
      handleViewServiceDetails(item, item.hasDashboard ? 'dashboard' : 'service');
    } else if (item.shopName || item.matchedItems) {
      handleViewFoodDetails(item);
    } else {
      navigation.navigate('DetailScreen', { id: item.id });
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
        navigation.navigate('ServicesStack', { screen: 'ServicesList' });
        break;
      default:
        break;
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
  
  // For assistant messages with data
  if (!isUser && item.data) {
    return (
      <View style={{ marginBottom: 8 }}>
        {/* Show avatar and text first */}
        <View style={[styles.messageWrapper, styles.assistantMessageWrapper]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarImage}>
              <Ionicons name="hardware-chip-outline" size={16} color={COLORS.green} />
            </View>
          </View>
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={[styles.messageText, styles.assistantText]}>
              {item.text}
            </Text>
          </View>
        </View>
        
        {/* Render the card - remove negative margin */}
        <View style={{ marginTop: 4 }}>
          {renderAIMessage(item, handleViewDetails, handleCall, handleViewMore)}
        </View>
      </View>
    );
  }
  
  // Regular message render
  return <AnimatedMessage item={item} isUser={isUser} />;
};

const renderTypingIndicator = () => {
  if (!loading) return null;

  return (
    <View style={[styles.messageWrapper, styles.assistantMessageWrapper]}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarImage}>
          <Ionicons name="hardware-chip-outline" size={16} color={COLORS.green} />
        </View>
      </View>
      <View style={[styles.messageBubble, styles.assistantBubble]}>
        <View style={styles.typingIndicator}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      </View>
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
          <Ionicons name="hardware-chip-outline" size={20} color={COLORS.white} />
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
      renderItem={renderMessage}
      ListFooterComponent={renderTypingIndicator}
      contentContainerStyle={styles.messagesContent}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      onLayout={() => flatListRef.current?.scrollToEnd()}
      showsVerticalScrollIndicator={false}
    />

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

  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 4,
  },

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