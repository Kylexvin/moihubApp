import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import WhatsAppFAB from './WhatsAppFAB';

const { width } = Dimensions.get('window');

// Skeleton Components
const SkeletonBox = ({ width, height, style }) => (
  <View 
    style={[
      {
        width,
        height,
        backgroundColor: '#E1E9EE',
        borderRadius: 8,
      },
      style
    ]}
  >
    <Animatable.View
      animation={{
        0: { opacity: 0.3 },
        0.5: { opacity: 0.7 },
        1: { opacity: 0.3 }
      }}
      iterationCount="infinite"
      duration={1500}
      style={{
        flex: 1,
        backgroundColor: '#F2F8FC',
        borderRadius: 8,
      }}
    />
  </View>
);

const MissionSkeleton = () => (
  <View style={styles.sectionContainer}>
    <View style={styles.missionContainer}>
      <View style={[styles.missionGradient, { backgroundColor: '#E1E9EE' }]}>
        <View style={styles.missionHeader}>
          <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
          <SkeletonBox width={150} height={20} style={{ marginLeft: 10 }} />
        </View>
        <SkeletonBox width="100%" height={60} style={{ marginVertical: 10 }} />
        <View style={styles.missionFooter}>
          <SkeletonBox width={16} height={16} style={{ borderRadius: 8 }} />
          <SkeletonBox width={120} height={16} style={{ marginLeft: 8 }} />
        </View>
      </View>
    </View>
  </View>
);

const HighlightSkeleton = () => (
  <View style={styles.sectionContainer}>
    <View style={styles.highlightContainer}>
      <View style={styles.highlightImageContainer}>
        <SkeletonBox width="100%" height={150} />
      </View>
      <View style={styles.highlightContent}>
        <View style={styles.highlightTitleContainer}>
          <SkeletonBox width={20} height={20} style={{ borderRadius: 10 }} />
          <SkeletonBox width={100} height={20} style={{ marginLeft: 8 }} />
        </View>
        <SkeletonBox width="100%" height={40} style={{ marginVertical: 10 }} />
        <SkeletonBox width={80} height={35} style={{ borderRadius: 20 }} />
      </View>
    </View>
  </View>
);

const AdsSkeleton = () => (
  <View style={styles.sectionContainer}>
    <SkeletonBox width={100} height={24} style={{ marginBottom: 15 }} />
    <View style={styles.adsContainer}>
      <SkeletonBox width={width - 40} height={200} style={{ borderRadius: 15 }} />
      <View style={styles.adIndicatorContainer}>
        {[0, 1, 2].map((_, index) => (
          <SkeletonBox 
            key={index} 
            width={8} 
            height={8} 
            style={{ borderRadius: 4, marginHorizontal: 3 }} 
          />
        ))}
      </View>
    </View>
  </View>
);

const VendorCallSkeleton = () => (
  <View style={styles.sectionContainer}>
    <View style={[styles.vendorCallContainer, { backgroundColor: '#E1E9EE' }]}>
      <View style={styles.vendorCallContent}>
        <SkeletonBox width={32} height={32} style={{ borderRadius: 16, marginBottom: 10 }} />
        <SkeletonBox width={150} height={24} style={{ marginBottom: 10 }} />
        <SkeletonBox width="100%" height={50} style={{ marginBottom: 15 }} />
        <SkeletonBox width={120} height={35} style={{ borderRadius: 20 }} />
      </View>
    </View>
  </View>
);

const HomeScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef(null);
  const adsRef = useRef(null);
  
  // Backend data states
  const [homescreenData, setHomescreenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAdSlide, setCurrentAdSlide] = useState(0);

  // Add icon loading check
  const [iconsLoaded, setIconsLoaded] = useState(false);

  // Check if icons are loaded
  useEffect(() => {
    const checkIcons = async () => {
      try {
        // Small delay to ensure icons are loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        setIconsLoaded(true);
      } catch (error) {
        console.error('Error loading icons:', error);
        setIconsLoaded(true); // Still show the UI even if icons fail
      }
    };
    
    checkIcons();
  }, []);

  // Cache keys
  const CACHE_KEY = 'homescreen_data';
  const CACHE_TIMESTAMP_KEY = 'homescreen_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Slideshow data - can be replaced with API data
  const slideData = [
    {
      id: 1,
      title: "Welcome to MoiHub",
      subtitle: "Your campus companion for everything you need",
      image: require('../assets/hero.jpg'),
      backgroundColor: '#2C5F2D',
      buttonText: "Get Started",
      buttonAction: () => navigation.navigate('Services')
    },
    {
      id: 2,
      title: "Fast Food Delivery",
      subtitle: "Delicious meals delivered to your doorstep in minutes",
      image: require('../assets/food.png'),
      backgroundColor: '#1976D2',
      buttonText: "Order Now",
      buttonAction: () => navigation.navigate('FoodStack', { screen: 'FoodHome' })
    },
    {
      id: 3,
      title: "Room Bookings",
      subtitle: "Find and book your perfect accommodation",
      image: require('../assets/acco.png'),
      backgroundColor: '#7B1FA2',
      buttonText: "Browse Rooms",
      buttonAction: () => navigation.navigate('AccomStack', { screen: 'RentalHome' })
    },
    {
      id: 4,
      title: "LinkMe Dating",
      subtitle: "Find real connections within Moi University",
      image: require('../assets/linkmelogo.png'),
      backgroundColor: '#FF4081',
      buttonText: "Get Started",
      buttonAction: () => navigation.navigate('LinkMe',{ screen: 'LinkMeEntry' } )
    }
  ];

  // Load cached data
  const loadCachedData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setHomescreenData(parsedData);
        
        // If we have cached data, stop loading immediately
        setLoading(false);
        
        // Check if cache is still fresh
        const now = Date.now();
        const cacheTime = cachedTimestamp ? parseInt(cachedTimestamp) : 0;
        const isCacheFresh = (now - cacheTime) < CACHE_DURATION;
        
        console.log('Cache found:', {
          isCacheFresh,
          cacheAge: now - cacheTime,
          maxAge: CACHE_DURATION
        });
        
        return { hasCache: true, isFresh: isCacheFresh };
      }
      
      return { hasCache: false, isFresh: false };
    } catch (error) {
      console.error('Error loading cached data:', error);
      return { hasCache: false, isFresh: false };
    }
  };

  // Fetch homescreen data from backend with better caching
  const fetchHomescreenData = async (showRefreshIndicator = false, forceRefresh = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      if (forceRefresh) setLoading(true);

      console.log('Fetching homescreen data...');
      const response = await axios.get('https://moihub.onrender.com/api/homescreen', {
        timeout: 10000, // 10 second timeout
      });
      
      const data = response.data;
      
      // Update state
      setHomescreenData(data);
      
      // Cache the data with timestamp
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      
      console.log('Data fetched and cached successfully');
      
    } catch (error) {
      console.error('Fetch homescreen failed:', error.message);
      
      // Only show error if we don't have cached data
      if (!homescreenData) {
        // Try to load any available cached data as fallback
        const fallback = await loadCachedData();
        if (!fallback.hasCache) {
          Alert.alert(
            'Connection Error', 
            'Unable to load data. Please check your internet connection and try again.',
            [
              {
                text: 'Retry',
                onPress: () => fetchHomescreenData(false, true)
              },
              {
                text: 'OK',
                style: 'cancel'
              }
            ]
          );
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      console.log('Initializing homescreen data...');
      
      // First, try to load cached data
      const cacheResult = await loadCachedData();
      
      if (cacheResult.hasCache) {
        // We have cached data, UI is already showing
        if (!cacheResult.isFresh) {
          // Cache is stale, fetch fresh data in background
          console.log('Cache is stale, fetching fresh data...');
          fetchHomescreenData(false, false);
        } else {
          console.log('Using fresh cached data');
        }
      } else {
        // No cached data, must fetch
        console.log('No cached data, fetching from server...');
        await fetchHomescreenData(false, true);
      }
    };

    initializeData();
  }, []);

  // Periodic background refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (cachedTimestamp) {
        const now = Date.now();
        const cacheTime = parseInt(cachedTimestamp);
        const shouldRefresh = (now - cacheTime) > CACHE_DURATION;
        
        if (shouldRefresh) {
          console.log('Background refresh triggered');
          fetchHomescreenData(false, false);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    fetchHomescreenData(true, false);
  }, []);

  // Auto-slide functionality for main slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % slideData.length;
        slideRef.current?.scrollToIndex({ 
          index: nextSlide, 
          animated: true 
        });
        return nextSlide;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [slideData.length]);

  // Auto-slide functionality for ads carousel
  useEffect(() => {
    if (homescreenData?.myAds?.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdSlide((prev) => {
          const nextSlide = (prev + 1) % homescreenData.myAds.length;
          adsRef.current?.scrollToIndex({ 
            index: nextSlide, 
            animated: true 
          });
          return nextSlide;
        });
      }, 5000); // Change ad slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [homescreenData?.myAds?.length]);

  const handleSlideChange = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const handleAdSlideChange = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
    setCurrentAdSlide(slideIndex);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    slideRef.current?.scrollToIndex({ 
      index, 
      animated: true 
    });
  };

  const goToAdSlide = (index) => {
    setCurrentAdSlide(index);
    adsRef.current?.scrollToIndex({ 
      index, 
      animated: true 
    });
  };

const handleLinkPress = async (url) => {
  try {
    // Handle WhatsApp links
    if (url.includes('wa.me') || url.includes('whatsapp.com')) {
      const phoneMatch = url.match(/\d+/);
      const phoneNumber = phoneMatch ? phoneMatch[0] : '';
      const messageMatch = url.split('text=')[1];
      const message = messageMatch ? decodeURIComponent(messageMatch) : '';

      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const formattedNumber = cleanNumber.startsWith('254')
        ? cleanNumber
        : `254${cleanNumber.replace(/^0/, '')}`;

      const encodedMessage = encodeURIComponent(message);

      const whatsappInstalled = await Linking.canOpenURL('whatsapp://');

      if (whatsappInstalled) {
        try {
          await Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`);
          return;
        } catch (err) {
          console.warn('WhatsApp deep link failed:', err);
        }
      }

      try {
        await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
        return;
      } catch (err) {
        console.warn('WhatsApp web failed:', err);
      }

      Alert.alert(
        'WhatsApp Not Available',
        'WhatsApp is not available on this device. Choose an option:',
        [
          {
            text: 'Copy Number',
            onPress: async () => {
              try {
                await Clipboard.setStringAsync(formattedNumber);
                Alert.alert('Copied!', `${formattedNumber} copied to clipboard`);
              } catch (copyErr) {
                console.error('Copy failed:', copyErr);
                Alert.alert('Error', 'Failed to copy number.');
              }
            }
          },
          {
            text: 'Open in Browser',
            onPress: async () => {
              try {
                await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
              } catch (browserErr) {
                console.error('Browser open failed:', browserErr);
                Alert.alert('Error', 'Failed to open in browser.');
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );

      return;
    }

    // Handle regular web links directly (skip canOpenURL check)
    if (url.startsWith('http')) {
      try {
        await Linking.openURL(url);
      } catch (err) {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Could not open the link.');
      }
      return;
    }

    // Fallback for other link types
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open this link on your device.');
    }

  } catch (error) {
    console.error('Error opening link:', error);
    Alert.alert('Error', 'Could not open the link. Please try again.');
  }
};

const openWhatsApp = async (phoneNumber, message = '') => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('254')
    ? cleanNumber
    : `254${cleanNumber.replace(/^0/, '')}`;
  const encodedMessage = encodeURIComponent(message);

  try {
    const canOpen = await Linking.canOpenURL('whatsapp://send');
    if (canOpen) {
      await Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`);
    } else {
      // Fallback to web version
      await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
    }
  } catch (error) {
    console.error('WhatsApp open failed:', error);
    Alert.alert('Error', 'Could not open WhatsApp.');
  }
};

const handleInquirePress = () => {
  const url = homescreenData?.highlight?.ctaLink || 'https://wa.me/254768610613?text=Hello, I have an inquiry';
  handleLinkPress(url);
};

const handleVendorCTAPress = () => {
  const url = homescreenData?.vendorCall?.ctaLink || 'https://wa.me/254768610613?text=I am interested in becoming a vendor';
  handleLinkPress(url);
};

// Alternative direct usage
const handleDirectWhatsApp = () => {
  openWhatsApp('254768610613', 'Hello, I have an inquiry about your services');
};

  // Animation references
  const fadeInDown = {
    0: {
      opacity: 0,
      translateY: -20,
    },
    1: {
      opacity: 1,
      translateY: 0,
    },
  };

  const serviceCategories = [
    { 
      title: "Emergency", 
      icon: "alert-circle-outline", 
      color: "#EF5350",
      onPress: () => navigation.navigate('Services', { screen: 'EmergencyServices' })
    },
    { 
      title: "My School", 
      icon: "school-outline", 
      color: "#66BB6A",
      onPress: () => navigation.navigate('MySchoolNavigator', { screen: 'MySchoolHome' })
    },
    { 
      title: "Food Delivery", 
      icon: "fast-food-outline", 
      color: "#42A5F5",
      onPress: () => navigation.navigate('FoodStack', { screen: 'FoodHome' })
    },
    { 
      title: "Local Services", 
      icon: "bicycle-outline", 
      color: "#FFB300",
      onPress: () => navigation.navigate('ServicesStack', { screen: 'LocalServices' }) 
    }
  ];

  const renderSlideItem = ({ item }) => (
    <View style={[styles.slideItem, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.slideContent}>
        <View style={styles.slideTextContainer}>
          <Animatable.Text 
            animation={fadeInDown} 
            duration={1200} 
            style={styles.slideTitle}
          >
            {item.title}
          </Animatable.Text>
          <Animatable.Text 
            animation={fadeInDown}
            duration={1200}
            delay={300}
            style={styles.slideSubtitle}
          >
            {item.subtitle}
          </Animatable.Text>
          <TouchableOpacity
            style={styles.slideButton}
            onPress={item.buttonAction}
          >
            <Text style={styles.slideButtonText}>{item.buttonText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.slideImageContainer}>
          <Image
            source={item.image}
            style={styles.slideImage}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );

  const renderAdItem = ({ item }) => (
    <View style={styles.adItem}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.adImage}
        resizeMode="cover"
      />
      <View style={styles.adOverlay}>
        <Text style={styles.adTitle}>{item.title}</Text>
        <Text style={styles.adCaption}>{item.caption}</Text>
        <TouchableOpacity
          style={styles.adButton}
          onPress={() => handleLinkPress(item.ctaLink)}
        >
          <Text style={styles.adButtonText}>{item.ctaText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#02604c" barStyle="light-content" />
      <LinearGradient
        colors={['#083028','#0a0a0a',  '#0a0a0a']}
        style={styles.background}
      />
        <WhatsAppFAB />
      {/* Header - Always visible */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Left: Logo and Text */}
          <View style={styles.logoTextContainer}>
            <Image
              source={require('../assets/moihublogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.appName}>MoiHub</Text>
              <Text style={styles.greeting}>Welcome back, {currentUser?.username || 'Guest'}!</Text>
            </View>
          </View>

          {/* Right: Profile */}
          <TouchableOpacity style={styles.profileButton}>
            {iconsLoaded ? (
              <Ionicons name="person-circle-outline" size={32} color="#2C5F2D" />
            ) : (
              <View style={{ width: 32, height: 32, backgroundColor: '#2C5F2D', borderRadius: 16 }} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Interactive Slideshow - Always visible */}
        <View style={styles.slideshowContainer}>
          <FlatList
            ref={slideRef}
            data={slideData}
            renderItem={renderSlideItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleSlideChange}
            getItemLayout={(data, index) => ({
              length: width - 40,
              offset: (width - 40) * index,
              index,
            })}
          />
          
          {/* Slide Indicators */}
          <View style={styles.indicatorContainer}>
            {slideData.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: currentSlide === index ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }
                ]}
                onPress={() => goToSlide(index)}
              />
            ))}
          </View>
        </View>

        {/* Service Categories - Always visible */}
        <View style={styles.sectionContainer}>          
          <View style={styles.categoriesContainer}>
            {serviceCategories.map((category, idx) => (
              <Animatable.View 
                key={idx}
                animation="bounceIn"
                delay={300 + (idx * 100)}
                duration={1500}
                style={styles.categoryItem}
              >
                <TouchableOpacity 
                  style={[styles.categoryIcon, { backgroundColor: category.color }]}
                  onPress={category.onPress}
                >
                  <Ionicons name={category.icon} size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.categoryText}>{category.title}</Text>
              </Animatable.View>
            ))}
          </View>
        </View>

        {/* API-dependent content with skeleton loading */}
        {loading ? (
          <>
            <MissionSkeleton />
            <HighlightSkeleton />
            <AdsSkeleton />
            <VendorCallSkeleton />
           
          </>
        ) : (
          <>
            {/* Today's Mission */}
            {homescreenData?.todaysMission && (
              <View style={styles.sectionContainer}>
                <Animatable.View 
                  animation="fadeInUp"
                  delay={500}
                  duration={1000}
                  style={styles.missionContainer}
                >
                  <LinearGradient
                    colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.missionGradient}
                  >
                    <View style={styles.missionHeader}>
                      {iconsLoaded ? (
                        <Ionicons name="rocket" size={24} color="#FFFFFF" />
                      ) : (
                        <View style={{ width: 24, height: 24, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12 }} />
                      )}
                      <Text style={styles.missionTitle}>{homescreenData.todaysMission.title}</Text>
                    </View>
                    <Text style={styles.missionContent}>{homescreenData.todaysMission.content}</Text>
                    <View style={styles.missionFooter}>
                      {iconsLoaded ? (
                        <Ionicons name="trending-up" size={16} color="#FFFFFF" />
                      ) : (
                        <View style={{ width: 16, height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }} />
                      )}
                      <Text style={styles.missionFooterText}>You've got this! 💪</Text>
                    </View>
                  </LinearGradient>
                </Animatable.View>
              </View>
            )}

            {/* Highlight Section */}
            {homescreenData?.highlight && (
              <View style={styles.sectionContainer}>
                <Animatable.View 
                  animation="fadeInUp"
                  delay={600}
                  duration={1000}
                  style={styles.highlightContainer}
                >
                  {homescreenData.highlight.graphicUrl && (
                    <View style={styles.highlightImageContainer}>
                      <Image
                        source={{ uri: homescreenData.highlight.graphicUrl }}
                        style={styles.highlightImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.highlightImageOverlay}
                      />
                    </View>
                  )}
                  <View style={styles.highlightContent}>
                    <View style={styles.highlightTitleContainer}>
                      {iconsLoaded ? (
                        <Ionicons name="flash" size={20} color="#FF6B6B" />
                      ) : (
                        <View style={{ width: 20, height: 20, backgroundColor: '#FF6B6B', borderRadius: 10 }} />
                      )}
                      <Text style={styles.highlightTitle}>{homescreenData.highlight.title}</Text>
                    </View>
                    <Text style={styles.highlightText}>{homescreenData.highlight.content}</Text>
                    <TouchableOpacity
                      style={styles.highlightButton}
                      onPress={handleInquirePress}
                    >
                      <Text style={styles.highlightButtonText}>Check out</Text>
                      {iconsLoaded ? (
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                      ) : (
                        <View style={{ width: 16, height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }} />
                      )}
                    </TouchableOpacity>
                  </View>
                </Animatable.View>
              </View>
            )}

            {/* Ads Carousel */}
            {homescreenData?.myAds && homescreenData.myAds.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Featured</Text>
                <View style={styles.adsContainer}>
                  <FlatList
                    ref={adsRef}
                    data={homescreenData.myAds}
                    renderItem={renderAdItem}
                    keyExtractor={(item) => item._id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleAdSlideChange}
                    getItemLayout={(data, index) => ({
                      length: width - 40,
                      offset: (width - 40) * index,
                      index,
                    })}
                  />
                  
                  {/* Ad Indicators */}
                  {homescreenData.myAds.length > 1 && (
                    <View style={styles.adIndicatorContainer}>
                      {homescreenData.myAds.map((_, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.indicator,
                            { backgroundColor: currentAdSlide === index ? '#01604c' : 'rgba(1,96,76,0.4)' }
                          ]}
                          onPress={() => goToAdSlide(index)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Vendor Call to Action */}
            {homescreenData?.vendorCall && (
              <View style={styles.sectionContainer}>
                <Animatable.View 
                  animation="fadeInUp"
                  delay={700}
                  duration={1000}
                  style={styles.vendorCallContainer}
                >
                  <View style={styles.vendorCallContent}>
                    {iconsLoaded ? (
                      <Ionicons name="business" size={32} color="#FFFFFF" style={styles.vendorCallIcon} />
                    ) : (
                      <View style={{ width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 16, marginBottom: 10 }} />
                    )}
                    <Text style={styles.vendorCallTitle}>{homescreenData.vendorCall.title}</Text>
                    <Text style={styles.vendorCallText}>{homescreenData.vendorCall.content}</Text>
                    <TouchableOpacity
                      style={styles.vendorCallButton}
                      onPress={() => handleLinkPress(homescreenData.vendorCall.ctaLink)}
                    >
                      <Text style={styles.vendorCallButtonText}>{homescreenData.vendorCall.ctaText}</Text>
                      {iconsLoaded ? (
                        <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
                      ) : (
                        <View style={{ width: 16, height: 16, backgroundColor: 'rgba(76,175,80,0.3)', borderRadius: 8 }} />
                      )}
                    </TouchableOpacity>
                  </View>
                </Animatable.View>
              </View>
            )}
          </>
        )}
        
        {/* Footer - Always visible */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>About</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>Policy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerCopyright}>Made by Kylex</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ivory', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'ivory',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#01604c',
  },
  header: {
    backgroundColor: 'ivory',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#01604b',
  },
  greeting: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  profileButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 5,
  },
  
  // Slideshow Styles
  slideshowContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  slideItem: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  slideContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  slideTextContainer: {
    flex: 1,
    paddingRight: 15,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
    lineHeight: 20,
  },
  slideButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  slideButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  slideImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#000',
  },

  // Enhanced Today's Mission Styles
  missionContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  missionGradient: {
    padding: 20,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  missionContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  missionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  missionFooterText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },

  // Enhanced Highlight Styles
  highlightContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  highlightImageContainer: {
    position: 'relative',
  },
  highlightImage: {
    width: '100%',
    height: 160,
  },
  highlightImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  highlightContent: {
    padding: 20,
  },
  highlightTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01604c',
    marginLeft: 8,
  },
  highlightText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  highlightButton: {
    backgroundColor: '#01604c',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#01604c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  highlightButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },

  // Ads Carousel Styles
  adsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  adItem: {
    width: width - 40,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },

  adOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  adCaption: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  adButton: {
    backgroundColor: '#01604c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  adButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },

  // Vendor Call Styles
  vendorCallContainer: {
    backgroundColor: '#01604c',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    borderColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)', // Only web — skip on native
    shadowColor: '#00FFC6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  vendorCallContent: {
    alignItems: 'center',
  },
  vendorCallTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  vendorCallText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  vendorCallButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorCallButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },

  footer: {
    marginTop: 30,
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  footerDivider: {
    fontSize: 12,
    color: '#7F8C8D',
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 2,
  },
  footerCopyright: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 6,
  },
});

export default HomeScreen;