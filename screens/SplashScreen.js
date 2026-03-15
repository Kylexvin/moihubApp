import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // Ensure the splash screen shows for exactly 2.5 seconds
    const timer = setTimeout(() => {
      // Call onFinish callback to move to next screen
      if (onFinish) {
        onFinish();
      }
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Logo animation */}
      <Animatable.View 
        animation="zoomIn" 
        duration={1000}
        style={styles.logoContainer}
      >
        <Animatable.Image
          source={require('../assets/moihublogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animatable.View>
      
      {/* Text animations */}
      <Animatable.Text 
        animation="fadeInUp"
        delay={500}
        style={styles.title}
      >
        MoiHub
      </Animatable.Text>
      
      <Animatable.Text 
        animation="fadeInUp"
        delay={800}
        style={styles.subtitle}
      >
        Your All-In-One University Solution
      </Animatable.Text>
      
      {/* Loading indicator dots */}
      <Animatable.View 
        animation="fadeIn"
        delay={1200}
        style={styles.loadingContainer}
      >
        <Animatable.View 
          animation={{
            0: { opacity: 0.3, scale: 0.8 },
            0.5: { opacity: 1, scale: 1 },
            1: { opacity: 0.3, scale: 0.8 }
          }}
          iterationCount="infinite"
          duration={1000}
          style={[styles.dot, styles.dot1]} 
        />
        <Animatable.View 
          animation={{
            0: { opacity: 0.3, scale: 0.8 },
            0.5: { opacity: 1, scale: 1 },
            1: { opacity: 0.3, scale: 0.8 }
          }}
          iterationCount="infinite"
          duration={1000}
          delay={200}
          style={[styles.dot, styles.dot2]} 
        />
        <Animatable.View 
          animation={{
            0: { opacity: 0.3, scale: 0.8 },
            0.5: { opacity: 1, scale: 1 },
            1: { opacity: 0.3, scale: 0.8 }
          }}
          iterationCount="infinite"
          duration={1000}
          delay={400}
          style={[styles.dot, styles.dot3]} 
        />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005f4b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 25,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 60,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginHorizontal: 5,
  },
  dot1: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dot2: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dot3: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  }
});

export default SplashScreen;
