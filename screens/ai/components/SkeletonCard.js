// screens/ai/components/SkeletonCard.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const SkeletonCard = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

  return (
    <View style={styles.container}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={styles.titlePlaceholder} />
        <View style={styles.detailPlaceholder} />
        <View style={styles.detailPlaceholder} />
        <View style={styles.buttonPlaceholder} />
      </View>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#1a221e',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#26302b',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  titlePlaceholder: {
    height: 18,
    width: '70%',
    backgroundColor: '#26302b',
    borderRadius: 4,
  },
  detailPlaceholder: {
    height: 14,
    width: '50%',
    backgroundColor: '#26302b',
    borderRadius: 4,
  },
  buttonPlaceholder: {
    height: 36,
    width: '100%',
    backgroundColor: '#26302b',
    borderRadius: 8,
    marginTop: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
});

export default SkeletonCard;