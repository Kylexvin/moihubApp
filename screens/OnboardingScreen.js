import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  BackHandler,
  StatusBar,
} from 'react-native';
import { Image } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from './theme/Theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to MoiHub',
    description: 'Your all-in-one student platform for life at Moi University.',
    icon: 'school-outline',
    accent: Colors.primary,
    features: ['Find Rentals', 'Shop Marketplace', 'Order Food'],
  },
  {
    id: '2',
    title: 'Live & Connect',
    description: 'Book verified rentals, find roommates, and settle in fast.',
    icon: 'home-outline',
    accent: Colors.secondary,
    features: ['Verified Rooms', 'Roommate Finder', 'Secure Booking'],
  },
  {
    id: '3',
    title: 'Shop & Discover',
    description: 'Buy, sell, order food, and explore student-run e-shops.',
    icon: 'storefront-outline',
    accent: Colors.accent,
    features: ['Marketplace', 'Food Orders', 'E-Shops'],
  },
  {
    id: '4',
    title: 'Build Your Network',
    description: 'Study groups, campus dating, blogs, and real-time chat — all here.',
    icon: 'people-outline',
    accent: '#3498db',
    features: ['LinkMe Dating', 'Study Groups', 'Campus Blogs'],
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const goToSlide = (index) => {
    flatListRef.current.scrollToIndex({ index });
    setCurrentIndex(index);
  };

  const currentSlide = slides[currentIndex];

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <Animatable.View
        animation="zoomIn"
        duration={600}
        style={[styles.iconRing, { borderColor: item.accent + '40' }]}
      >
        <View style={[styles.iconInner, { backgroundColor: item.accent + '18' }]}>
          <Ionicons name={item.icon} size={64} color={item.accent} />
        </View>
      </Animatable.View>

      <Animatable.Text animation="fadeInUp" delay={200} style={styles.title}>
        {item.title}
      </Animatable.Text>

      <Animatable.Text animation="fadeInUp" delay={300} style={styles.description}>
        {item.description}
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={400} style={styles.featuresRow}>
        {item.features.map((f, i) => (
          <View key={i} style={[styles.featureChip, { borderColor: item.accent + '60' }]}>
            <View style={[styles.featureDot, { backgroundColor: item.accent }]} />
            <Text style={[styles.featureText, { color: item.accent }]}>{f}</Text>
          </View>
        ))}
      </Animatable.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Background gradient accent */}
      <View style={[styles.bgGlow, { backgroundColor: currentSlide.accent + '12' }]} />

      {/* Header */}
      <View style={styles.header}>
<View style={styles.logoContainer}>
  <Image 
                source={require('../assets/moihublogo.png')}

    style={styles.logo}
    resizeMode="contain"
  />
  <Text style={styles.logoText}>
    <Text style={{ color: Colors.primary }}>Moi</Text>Hub
  </Text>
</View>
        <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom controls */}
      <View style={styles.bottomContainer}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  i === currentIndex && [styles.dotActive, { backgroundColor: currentSlide.accent }],
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity onPress={goToNextSlide} activeOpacity={0.85}>
          <LinearGradient
            colors={
              currentIndex === slides.length - 1
                ? [Colors.primary, '#083028']
                : [currentSlide.accent, currentSlide.accent + 'cc']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons
              name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={18}
              color="#000"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Step counter */}
        <Text style={styles.stepText}>
          {currentIndex + 1} / {slides.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: Spacing.md,
  },
logoContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
logo: {
  width: 28,
  height: 28,
},
logoText: {
  fontSize: 22,
  fontWeight: '800',
  color: Colors.text,
  letterSpacing: 0.5,
}, 
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 20,
  },
  iconRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    alignItems: 'center',
    gap: Spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: BorderRadius.round,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  stepText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default OnboardingScreen;