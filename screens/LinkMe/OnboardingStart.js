import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const OnboardingStart = ({ navigation }) => {
  const handleStart = () => {
    navigation.navigate('IdentityStep');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Floating Hearts Animation Background */}
        <View style={styles.heartsContainer}>
          <Text style={[styles.floatingHeart, styles.heart1]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart2]}>💙</Text>
          <Text style={[styles.floatingHeart, styles.heart3]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart4]}>💙</Text>
          <Text style={[styles.floatingHeart, styles.heart5]}>💜</Text>
        </View>

        {/* Glowing Orbs */}
        <View style={[styles.glowOrb, styles.orb1]} />
        <View style={[styles.glowOrb, styles.orb2]} />
        <View style={[styles.glowOrb, styles.orb3]} />

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoGlow}>
              <Image
                source={require('../../assets/linkmelogo.png')}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Welcome to{' '}
              <Text style={styles.brandText}>LinkMe</Text>
            </Text>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                Step into the future of{' '}
                <Text style={styles.highlightText}>love</Text>
              </Text>
              <Text style={styles.subtitle}>
                Where connections transcend reality
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <LinearGradient
              colors={['#7b20a1', '#9d4edd', '#c77dff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.startButtonText}>Begin Your Journey</Text>
              <View style={styles.buttonGlow} />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>
              ✨ Powered by MoiHub • Designed for Hearts ✨
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 20,
    opacity: 0.3,
  },
  heart1: {
    top: '15%',
    left: '10%',
    transform: [{ rotate: '15deg' }],
  },
  heart2: {
    top: '25%',
    right: '15%',
    transform: [{ rotate: '-10deg' }],
  },
  heart3: {
    top: '45%',
    left: '5%',
    transform: [{ rotate: '25deg' }],
  },
  heart4: {
    top: '65%',
    right: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  heart5: {
    top: '35%',
    left: '50%',
    transform: [{ rotate: '5deg' }],
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  orb1: {
    width: 120,
    height: 120,
    backgroundColor: '#7b20a1',
    top: '20%',
    right: '-10%',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  orb2: {
    width: 80,
    height: 80,
    backgroundColor: '#c77dff',
    bottom: '30%',
    left: '-5%',
    shadowColor: '#c77dff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  orb3: {
    width: 60,
    height: 60,
    backgroundColor: '#9d4edd',
    top: '50%',
    right: '80%',
    shadowColor: '#9d4edd',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 80,
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoGlow: {
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  image: {
    width: 180,
    height: 180,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(123, 32, 161, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  brandText: {
    color: '#c77dff',
    fontWeight: '900',
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 26,
    marginBottom: 8,
  },
  highlightText: {
    color: '#ff69b4',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 105, 180, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    zIndex: 2,
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    position: 'relative',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    color: '#b19cd9',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default OnboardingStart;
