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
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { renderAIMessage } from './components';

const AIChatMainScreen = ({ navigation }) => {
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
        timestamp: new Date()
      }
    ]);
  }, []);

  // Handle view details navigation
  const handleViewDetails = (rental) => {
    // Navigate to rental details screen with the rental ID
    navigation.navigate('RentalDetails', { 
      rentalId: rental.id,
      rentalName: rental.name 
    });
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: inputText.trim(),
      module: null,
      data: null,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const payload = {
        message: inputText.trim(),
        userId: 'temp-user-id'
      };

      // Include sessionId if we have one
      if (sessionId) {
        payload.sessionId = sessionId;
      }

      const response = await axios.post('/api/ai/chat', payload);

      // Store sessionId for follow-up conversations
      if (response.data.sessionId) {
        setSessionId(response.data.sessionId);
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.data.message || 'Sorry, I could not process your request.',
        module: response.data.module || null,
        data: response.data.data || null,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: '😅 Sorry, something went wrong. Please try again.',
        module: null,
        data: null,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={styles.messageContainer}>
        {/* Message Bubble */}
        <View style={[
          styles.messageWrapper,
          isUser ? styles.userWrapper : styles.aiWrapper
        ]}>
          <View style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble
          ]}>
            <Text style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText
            ]}>
              {item.text}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        {/* Render UI Component if data exists */}
        {!isUser && item.data && item.data.count > 0 && (
          <View style={styles.componentWrapper}>
            {renderAIMessage(item, handleViewDetails)}
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!loading) return null;
    
    return (
      <View style={[styles.messageWrapper, styles.aiWrapper]}>
        <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
          <View style={styles.typingContainer}>
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
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>MoiHub Assistant</Text>
            <Text style={styles.headerSubtitle}>Your campus AI helper</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        ListFooterComponent={renderTypingIndicator}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask MoiHub anything..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2C3E50',
    borderBottomWidth: 1,
    borderBottomColor: '#1a2a3a',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34495E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#90a4ae',
    marginTop: 1,
  },
  headerButton: {
    padding: 4,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
  },
  messageWrapper: {
    flexDirection: 'row',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  componentWrapper: {
    marginTop: 8,
    marginLeft: 8,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#2C3E50',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    fontSize: 16,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0b0b0',
  },
});

export default AIChatMainScreen;