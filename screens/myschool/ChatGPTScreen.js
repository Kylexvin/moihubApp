import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const ChatGPTScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'assistant',
      message: 'Hello! I\'m your AI assistant. How can I help you with your studies today?',
      timestamp: '10:30 AM'
    }
  ]);

  const quickPrompts = [
    { text: 'Explain quantum physics', icon: '⚛️' },
    { text: 'Help with essay writing', icon: '✍️' },
    { text: 'Math problem solving', icon: '📐' },
    { text: 'Study tips', icon: '📚' },
    { text: 'Programming help', icon: '💻' },
    { text: 'Research assistance', icon: '🔍' }
  ];

  const features = [
    {
      title: 'Academic Support',
      description: 'Get help with assignments, research, and study materials',
      icon: '🎓',
      color: '#DBEAFE'
    },
    {
      title: 'Code Assistance',
      description: 'Debug code, learn programming concepts, and get syntax help',
      icon: '💻',
      color: '#D1FAE5'
    },
    {
      title: 'Writing Help',
      description: 'Improve your essays, reports, and creative writing',
      icon: '✍️',
      color: '#FEF3C7'
    },
    {
      title: '24/7 Availability',
      description: 'AI assistant available anytime you need help',
      icon: '🕒',
      color: '#FCE7F3'
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: chatHistory.length + 1,
        type: 'user',
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory([...chatHistory, newMessage]);
      setMessage('');
      
      // Simulate assistant response
      setTimeout(() => {
        const assistantResponse = {
          id: chatHistory.length + 2,
          type: 'assistant',
          message: 'I understand your question. Let me help you with that...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, assistantResponse]);
      }, 1000);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setMessage(prompt);
  };

  const renderMessage = (msg) => (
    <View
      key={msg.id}
      style={[
        styles.messageContainer,
        msg.type === 'user' ? styles.userMessage : styles.assistantMessage
      ]}
    >
      <Text style={[
        styles.messageText,
        msg.type === 'user' ? styles.userMessageText : styles.assistantMessageText
      ]}>
        {msg.message}
      </Text>
      <Text style={styles.messageTime}>{msg.timestamp}</Text>
    </View>
  );

  const renderQuickPrompts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Prompts</Text>
      <View style={styles.promptsContainer}>
        {quickPrompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.promptButton}
            onPress={() => handleQuickPrompt(prompt.text)}
          >
            <Text style={styles.promptIcon}>{prompt.icon}</Text>
            <Text style={styles.promptText}>{prompt.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>What I Can Help With</Text>
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View
            key={index}
            style={[styles.featureCard, { backgroundColor: feature.color }]}
          >
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ChatGPT Assistant</Text>
        <Text style={styles.headerSubtitle}>Your AI study companion</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chat History */}
        <View style={styles.chatContainer}>
          <Text style={styles.chatTitle}>Chat History</Text>
          <View style={styles.chatMessages}>
            {chatHistory.map(renderMessage)}
          </View>
        </View>

        {/* Quick Prompts */}
        {renderQuickPrompts()}

        {/* Features */}
        {renderFeatures()}

        {/* Usage Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Tips</Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipText}>💡 Be specific in your questions for better responses</Text>
            <Text style={styles.tipText}>📝 Ask for step-by-step explanations when learning</Text>
            <Text style={styles.tipText}>🔄 Don't hesitate to ask follow-up questions</Text>
            <Text style={styles.tipText}>📚 Request examples to better understand concepts</Text>
          </View>
        </View>
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message here..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            message.trim() ? styles.sendButtonActive : styles.sendButtonInactive
          ]}
          onPress={handleSendMessage}
          disabled={!message.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#C7D2FE',
  },
  content: {
    flex: 1,
  },
  chatContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  chatMessages: {
    maxHeight: 200,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  promptButton: {
    width: (width - 84) / 2,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promptIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 84) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 120,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  tipsContainer: {
    paddingLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#4F46E5',
  },
  sendButtonInactive: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChatGPTScreen;