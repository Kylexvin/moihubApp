// screens/MatchScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const MatchScreen = ({ navigation, route }) => {
  const { currentUser, matchedUser } = route.params;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    playMatchSound();
    startAnimations();
  }, []);

  const playMatchSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/moihub_sound.mp3'), // Add your sound file
        { shouldPlay: true, volume: 0.8 }
      );
      
      // Unload sound after playing
      setTimeout(() => {
        sound.unloadAsync();
      }, 3000);
    } catch (error) {
      console.log('Error playing match sound:', error);
    }
  };

  const startAnimations = () => {
    // Reset all animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.3);
    heartScale.setValue(0);
    sparkleOpacity.setValue(0);
    slideUpAnim.setValue(height);

    // Sequence of animations
    Animated.sequence([
      // Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Scale in profile pictures
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Sparkle effect
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Heart animation
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1.2,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Slide up buttons
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSendMessage = () => {
    navigation.navigate('Messages', { 
      recipientId: matchedUser._id,
      recipientName: matchedUser.displayName 
    });
  };

  const handleKeepSwiping = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim }
        ]}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF8E8E', '#FFB4B4']}
          style={styles.gradient}
        >
          {/* Sparkle Effects */}
          <Animated.View 
            style={[
              styles.sparkleContainer,
              { opacity: sparkleOpacity }
            ]}
          >
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: Math.random() * width,
                    top: Math.random() * height * 0.6,
                    transform: [
                      { rotate: `${Math.random() * 360}deg` }
                    ]
                  }
                ]}
              >
                <Ionicons name="star" size={16} color="#FFD700" />
              </View>
            ))}
          </Animated.View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleKeepSwiping}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Match Text */}
            <Text style={styles.matchText}>IT'S A MATCH!</Text>
            
            {/* Heart Icon */}
            <Animated.View 
              style={[
                styles.heartContainer,
                { 
                  transform: [{ scale: heartScale }],
                  opacity: sparkleOpacity
                }
              ]}
            >
              <Ionicons name="heart" size={60} color="#FFD700" />
            </Animated.View>

            {/* Profile Pictures */}
            <Animated.View 
              style={[
                styles.profileContainer,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <View style={styles.profileWrapper}>
                <Image 
                  source={{ uri: currentUser?.profilePhotoUrl || 'https://via.placeholder.com/150' }}
                  style={styles.profileImage}
                />
                <View style={styles.profileBorder} />
              </View>
              
              <View style={styles.profileWrapper}>
                <Image 
                  source={{ uri: matchedUser?.profilePhotoUrl || 'https://via.placeholder.com/150' }}
                  style={styles.profileImage}
                />
                <View style={styles.profileBorder} />
              </View>
            </Animated.View>

            {/* Names */}
            <Text style={styles.namesText}>
              You and {matchedUser?.displayName} liked each other
            </Text>
          </View>

          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              { transform: [{ translateY: slideUpAnim }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.sendMessageButton}
              onPress={handleSendMessage}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.buttonGradient}
              >
                <Ionicons name="chatbubble" size={24} color="#FFF" />
                <Text style={styles.buttonText}>SEND MESSAGE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.keepSwipingButton}
              onPress={handleKeepSwiping}
            >
              <Text style={styles.keepSwipingText}>KEEP SWIPING</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  matchText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heartContainer: {
    marginBottom: 30,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileWrapper: {
    position: 'relative',
    marginHorizontal: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  profileBorder: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  namesText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  sendMessageButton: {
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  keepSwipingButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  keepSwipingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
// $env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.100.6"
// $env:EXPO_DEVTOOLS_LISTEN_ADDRESS="192.168.100.6"
// npx expo start --lan --clear

export default MatchScreen; 