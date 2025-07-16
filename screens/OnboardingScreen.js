import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Dimensions,
  BackHandler 
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Add BackHandler to prevent back button during onboarding
  useEffect(() => {
    console.log("Onboarding screen mounted");
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Prevent going back during onboarding
        return true;
      }
    );

    return () => {
      console.log("Onboarding screen unmounting");
      backHandler.remove();
    };
  }, []);
  
const slides = [
  {
    id: '1',
    title: 'Find Rentals Easily',
    description: 'Browse and book verified student accommodations near Moi University with ease.',
    icon: 'home-outline', // Ionicons
  },
  {
    id: '2',
    title: 'Shop Smart',
    description: 'Access second-hand items, groceries, and campus essentials.',
    icon: 'cart-outline', // Ionicons replacement for shopping
  },
  {
    id: '3',
    title: 'Connect & Collaborate',
    description: 'Find roommates, join study groups, and build your campus network.',
    icon: 'people-outline', // Ionicons replacement for group
  },
];


  // Handle next slide
  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      console.log(`Moving to slide ${currentIndex + 1}`);
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last slide, complete onboarding
      console.log("Last slide reached, completing onboarding");
      onComplete();
    }
  };

  // Handle skip
  const handleSkip = () => {
    console.log("Onboarding skipped");
    onComplete();
  };

  // Render individual slide
  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slide}>
        <Animatable.View 
          animation="fadeIn"
          duration={1000}
          style={styles.iconContainer}
        >
          <Ionicons name={item.icon} size={100} color="#005f4b" />
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={300}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animatable.View>
      </View>
    );
  };

  // Render pagination dots
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#005f4b' : '#cccccc' }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          console.log(`Scrolled to index ${index}`);
          setCurrentIndex(index);
        }}
      />
      
      {renderPagination()}
      
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={goToNextSlide}
      >
        <Text style={styles.nextButtonText}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ivory',
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 40,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 95, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005f4b',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#005f4b',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#005f4b',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 50,
    alignSelf: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;