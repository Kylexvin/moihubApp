import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AwaitingApproval = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Floating Hearts */}
        <View style={styles.heartsContainer}>
          <Text style={[styles.floatingHeart, styles.heart1]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart2]}>💙</Text>
          <Text style={[styles.floatingHeart, styles.heart3]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart4]}>💙</Text>
        </View>

        {/* Glowing Orbs */}
        <View style={[styles.glowOrb, styles.orb1]} />
        <View style={[styles.glowOrb, styles.orb2]} />

        <View style={styles.inner}>
          <Image
            source={require('../../assets/linkmelogo.png')}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Awaiting Approval</Text>
          <Text style={styles.message}>
            Your profile has been submitted and is now under review. This process usually takes 24 hours. You’ll be notified once it’s complete. Keep checking this page,contact admin if otherwise.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={['#7b20a1', '#9d4edd', '#c77dff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.backButtonText}>Return Home</Text>
              <View style={styles.buttonGlow} />
            </LinearGradient>
          </TouchableOpacity>
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
    fontSize: 16,
    opacity: 0.2,
  },
  heart1: {
    top: '15%',
    left: '15%',
    transform: [{ rotate: '15deg' }],
  },
  heart2: {
    top: '30%',
    right: '10%',
    transform: [{ rotate: '-10deg' }],
  },
  heart3: {
    top: '70%',
    left: '10%',
    transform: [{ rotate: '25deg' }],
  },
  heart4: {
    top: '85%',
    right: '20%',
    transform: [{ rotate: '-15deg' }],
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.08,
  },
  orb1: {
    width: 100,
    height: 100,
    backgroundColor: '#7b20a1',
    top: '10%',
    right: '-15%',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  orb2: {
    width: 80,
    height: 80,
    backgroundColor: '#c77dff',
    bottom: '20%',
    left: '-10%',
    shadowColor: '#c77dff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.3)',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(123, 32, 161, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  message: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  backButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
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
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
});

export default AwaitingApproval;
