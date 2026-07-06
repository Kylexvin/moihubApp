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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { renderAIMessage } from './components';

const { width } = Dimensions.get('window');

// ─── Theme Colors ────────────────────────────────────────────────────────────
const C = {
  bg: '#f5f5f5',
  headerBg: '#2C3E50',
  surface: '#ffffff',
  surfaceAlt: '#f8f9fa',
  inputBg: '#f0f0f0',
  accent: '#059669',
  accentMuted: '#6B9F8A',
  own: '#059669',
  other: '#ffffff',
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMeta: '#888888',
  border: '#e0e0e0',
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
        text: "👋 Hi! I'm your MoiHub Assistant.\n\nI can help you with:\n🏠 Rentals\n🍔 Food\n✂️ Services\n🛍️ Marketplace\n\nJust tell me what you're looking for!",
        module: null,
        data: null,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const payload = {
        message: inputText.trim(),
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

  const handleViewRentalDetails = (rental) => {
    navigation.navigate('AccomStack', {
      screen: 'RentalDetail',
      params: { rentalId: rental.id },
    });
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={styles.messageContainer}>
        <View
          style={[
            styles.bubbleRow,
            isUser ? styles.bubbleRowOwn : styles.bubbleRowOther,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isUser ? styles.bubbleOwn : styles.bubbleOther,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isUser ? styles.bubbleTextOwn : styles.bubbleTextOther,
              ]}
            >
              {item.text}
            </Text>

            <View style={styles.bubbleMeta}>
              <Text style={styles.bubbleTime}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <View
              style={[
                styles.tail,
                isUser ? styles.tailOwn : styles.tailOther,
              ]}
            />
          </View>
        </View>

        {!isUser && item.data && item.data.count > 0 && (
          <View style={styles.componentWrapper}>
            {renderAIMessage(item, handleViewRentalDetails)}
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!loading) return null;

    return (
      <View style={[styles.bubbleRow, styles.bubbleRowOther]}>
        <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
          <View style={styles.typingContainer}>
            <View style={[styles.typingDot, { animationDelay: '0s' }]} />
            <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
            <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
          </View>
          <View style={[styles.tail, styles.tailOther]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </TouchableOpacity>

        <View style={styles.headerAvatarWrap}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>🤖</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerName}>MoiHub Assistant</Text>
          <Text style={styles.headerStatus}>Online • AI Assistant</Text>
        </View>

        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="ellipsis-vertical" size={24} color={C.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        ListFooterComponent={renderTypingIndicator}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
        inverted={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Ask MoiHub anything..."
              placeholderTextColor={C.textMeta}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={C.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: C.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerBack: {
    padding: 6,
    marginRight: 4,
  },
  headerAvatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34495E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 22,
    color: C.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.accent,
    borderWidth: 2,
    borderColor: C.headerBg,
  },
  headerMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.1,
  },
  headerStatus: {
    fontSize: 11,
    color: '#90a4ae',
    marginTop: 1,
    textTransform: 'lowercase',
  },
  headerRight: {
    padding: 8,
  },

  messageList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },

  messageContainer: {
    marginVertical: 2,
  },

  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  bubbleRowOwn: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: '100%',
    position: 'relative',
  },
  bubbleOwn: {
    backgroundColor: C.own,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: C.other,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },

  tail: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
  },
  tailOwn: {
    right: -6,
    borderTopWidth: 8,
    borderTopColor: C.own,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  tailOther: {
    left: -6,
    borderTopWidth: 8,
    borderTopColor: C.other,
    borderRightWidth: 8,
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },

  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextOwn: {
    color: C.white,
  },
  bubbleTextOther: {
    color: C.textPrimary,
  },

  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  bubbleTime: {
    fontSize: 10,
    color: C.textMeta,
  },

  typingBubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.textSecondary,
  },

  componentWrapper: {
    marginTop: 4,
    marginLeft: 8,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: C.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: C.textPrimary,
    lineHeight: 20,
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  sendBtnDisabled: {
    backgroundColor: C.accentMuted,
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default AIChatMainScreen;