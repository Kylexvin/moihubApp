// C:\Users\Administrator\Projects\moihub-clean\screens\AIFAB.js

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  PanResponder,
  Alert,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AIFAB = () => {
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for floating effect
  const translateY = useRef(new Animated.Value(0)).current;

  // Pulse animation for the FAB
  useEffect(() => {
    startPulseAnimation();
    startFloatingAnimation();
    
    // Show tooltip after 3 seconds
    const timer = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startFloatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    Animated.spring(rotateAnim, {
      toValue: isOpen ? 0 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    if (!isOpen) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }).start();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeMenu = () => {
    if (isOpen) {
      toggleMenu();
    }
  };

  const handleChatPress = () => {
    closeMenu();
    // Navigate to AI Chat Navigator
    navigation.navigate('AIChatNavigator');
  };

  const handleVoicePress = () => {
    closeMenu();
    Alert.alert(
      'Voice Assistant',
      'Voice recognition feature coming soon! 🎤',
      [{ text: 'OK' }]
    );
  };

  const handleHelpPress = () => {
    closeMenu();
    Alert.alert(
      'Help Center',
      'How can we help you?\n\n• FAQ\n• Contact Support\n• User Guide\n• Report Issue',
      [
        { text: 'FAQ', onPress: () => {} },
        { text: 'Contact', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleQuickAction = () => {
    closeMenu();
    Alert.alert(
      'Quick Actions',
      'Select an action:',
      [
        { text: '📅 Campus Events', onPress: () => navigation.navigate('BlogsNavigator', { screen: 'Blogs' }) },
        { text: '🍕 Food Delivery', onPress: () => navigation.navigate('FoodStack', { screen: 'FoodHome' }) },
        { text: '🛍️ Marketplace', onPress: () => navigation.navigate('SecondHandStack') },
        { text: '🏠 Find Roommate', onPress: () => navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Handle drag if needed
      },
    })
  ).current;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: fadeAnim,
              }
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <Animatable.View 
          animation="fadeInUp"
          duration={500}
          style={styles.tooltipContainer}
        >
          <View style={styles.tooltip}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" style={styles.tooltipIcon} />
            <Text style={styles.tooltipText}>AI Assistant Ready!</Text>
            <Text style={styles.tooltipSubtext}>Tap to get help</Text>
          </View>
          <View style={styles.tooltipArrow} />
        </Animatable.View>
      )}

      {/* Menu Items */}
      {isOpen && (
        <>
          {/* Help Option */}
          <Animated.View
            style={[
              styles.menuItem,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, -130],
                    })
                  }
                ],
                opacity: fadeAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.menuButton, styles.helpButton]} 
              onPress={handleHelpPress}
              activeOpacity={0.8}
            >
              <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.menuLabel}>Help</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Voice Option */}
          <Animated.View
            style={[
              styles.menuItem,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, -75],
                    })
                  },
                  { translateX: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -70],
                    })
                  }
                ],
                opacity: fadeAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.menuButton, styles.voiceButton]} 
              onPress={handleVoicePress}
              activeOpacity={0.8}
            >
              <Ionicons name="mic-outline" size={24} color="#FFFFFF" />
              <Text style={styles.menuLabel}>Voice</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Actions Option */}
          <Animated.View
            style={[
              styles.menuItem,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, -75],
                    })
                  },
                  { translateX: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 70],
                    })
                  }
                ],
                opacity: fadeAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.menuButton, styles.quickActionButton]} 
              onPress={handleQuickAction}
              activeOpacity={0.8}
            >
              <Ionicons name="flash-outline" size={24} color="#FFFFFF" />
              <Text style={styles.menuLabel}>Quick</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Chat Option - Main Option */}
          <Animated.View
            style={[
              styles.menuItem,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, -25],
                    })
                  }
                ],
                opacity: fadeAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.menuButton, styles.chatButton]} 
              onPress={handleChatPress}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
              <Text style={styles.menuLabel}>Chat</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Main FAB Button */}
      <Animated.View 
        style={[
          styles.fabContainer,
          {
            transform: [
              { translateY },
              { scale: pulseAnim },
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleMenu}
          style={styles.fabTouchable}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD', '#2C5F2D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
            </Animated.View>
            
            {/* Ripple Effect Rings */}
            <View style={styles.ringContainer}>
              <View style={[styles.ring, styles.ring1]} />
              <View style={[styles.ring, styles.ring2]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* AI Status Indicator */}
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 999,
    alignItems: 'center',
  },
  fabTouchable: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.5)',
    top: 0,
    left: 0,
  },
  ring1: {
    animation: 'pulse-ring 2s ease-out infinite',
  },
  ring2: {
    animation: 'pulse-ring 2s ease-out 1s infinite',
  },
  statusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  
  // Menu Items
  menuItem: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 998,
    alignItems: 'center',
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  helpButton: {
    backgroundColor: '#9C27B0',
  },
  voiceButton: {
    backgroundColor: '#FF9800',
  },
  quickActionButton: {
    backgroundColor: '#F44336',
  },
  chatButton: {
    backgroundColor: '#2196F3',
  },
  menuLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  
  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 997,
  },
  
  // Tooltip
  tooltipContainer: {
    position: 'absolute',
    bottom: 100,
    right: 90,
    zIndex: 1000,
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: '#2C5F2D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  tooltipIcon: {
    marginBottom: 4,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tooltipSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 8,
    borderTopColor: '#2C5F2D',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    marginTop: -1,
  },
});

export default AIFAB;