// screens/ai/components/AnimatedMessage.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  green: '#10B981',
  greenLight: '#14332a',
  textPrimary: '#f0f0f0',
  textMeta: '#6b7570',
  border: '#26302b',
  surface: '#1a221e',
  userBubble: '#14332a',
  userBubbleBorder: '#1d4a3b',
};

const AnimatedMessage = ({ item, isUser }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          })
        }]
      }}
    >
      <View style={[styles.messageWrapper, isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarImage}>
              <Ionicons name="hardware-chip-outline" size={16} color={COLORS.green} />
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
    maxWidth: '78%',
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
  timeText: {
    fontSize: 10,
    color: COLORS.textMeta,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default AnimatedMessage;