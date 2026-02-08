import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const OnboardingModal = ({ visible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef(null);

  const steps = [
    {
      id: 1,
      icon: 'home-outline',
      iconColor: '#4CAF50',
      title: 'Welcome to MoiHub!',
      description: 'Your all-in-one campus companion. Explore food delivery, marketplace, services, and more—all in one place.',
      gradient: ['#4CAF50', '#45B7D1'],
    },
    {
      id: 2,
      icon: 'rocket-outline',
      iconColor: '#FF6B6B',
      title: 'Quick Access Categories',
      description: 'Use the category buttons to quickly jump to Emergency Services, Student Portal, Food Delivery, and Local Services.',
      gradient: ['#FF6B6B', '#FFA726'],
    },
    {
      id: 3,
      icon: 'heart-outline',
      iconColor: '#7B1FA2',
      title: 'Personalized Just for You',
      description: 'Discover tailored content, featured services, trending marketplace items, and your recently viewed sections.',
      gradient: ['#7B1FA2', '#FF4081'],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDotPress = (index) => {
    setCurrentStep(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleMomentumScrollEnd = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentStep(slideIndex);
  };

  const renderStep = ({ item, index }) => (
    <View style={styles.stepContainer}>
      <Animatable.View
        animation="fadeInUp"
        duration={800}
        delay={200}
        style={styles.stepContent}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Ionicons name={item.icon} size={60} color="#FFFFFF" />
        </LinearGradient>

        <Text style={styles.stepTitle}>{item.title}</Text>
        <Text style={styles.stepDescription}>{item.description}</Text>
      </Animatable.View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          {/* Steps Carousel */}
          <FlatList
            ref={flatListRef}
            data={steps}
            renderItem={renderStep}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {steps.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleDotPress(index)}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      currentStep === index ? '#01604c' : 'rgba(1,96,76,0.3)',
                    width: currentStep === index ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {currentStep < steps.length - 1 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleNext}
              >
                <Text style={styles.getStartedButtonText}>Get Started</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(1,96,76,0.1)',
    borderRadius: 20,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#01604c',
  },
  stepContainer: {
    width: width * 0.9 - 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: 'all 0.3s ease',
  },
  actionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  nextButton: {
    backgroundColor: '#01604c',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#01604c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default OnboardingModal;