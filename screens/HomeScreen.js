import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  Alert,
  RefreshControl,
  Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import WhatsAppFAB from './WhatsAppFAB';
import DataService from '../services/DataService';

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

  // Personalization states
  const [personalizedFeed, setPersonalizedFeed] = useState([]);
  const [exploreSections, setExploreSections] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [iconsLoaded, setIconsLoaded] = useState(false);

  // Check if icons are loaded
  useEffect(() => {
    const checkIcons = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        setIconsLoaded(true);
      } catch (error) {
        console.error('Error loading icons:', error);
        setIconsLoaded(true);
      }
    };
    
    checkIcons();
  }, []);

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Track user behavior
  const trackUserBehavior = async (action, screen, metadata = {}) => {
    try {
      await DataService.trackUserAction(
        currentUser?.id || 'anonymous',
        action,
        screen,
        metadata
      );
    } catch (error) {
      console.error('Error tracking user behavior:', error);
    }
  };

  // Generate personalized content
  const generatePersonalizedContent = async () => {
    try {
      const recent = await DataService.getRecentlyViewed();
      setRecentlyViewed(recent.length > 0 ? recent : getDefaultRecentlyViewed());
      setPersonalizedFeed(getDefaultPersonalizedFeed());
      setExploreSections(getDefaultExploreSections());
    } catch (error) {
      console.error('Error generating personalized content:', error);
      setPersonalizedFeed(getDefaultPersonalizedFeed());
      setExploreSections(getDefaultExploreSections());
      setRecentlyViewed(getDefaultRecentlyViewed());
    }
  };

const getDefaultPersonalizedFeed = () => [
  {
    id: 1,
    type: 'BLOG',
    title: 'Campus Events',
    description: '📝 Latest campus updates',
    icon: '📝',
    action: () => {
      if (trackUserBehavior) {
        trackUserBehavior('feed_click', 'Blogs', { type: 'blog' });
      }
      navigation.navigate('BlogsNavigator', { screen: 'Blogs' });
    }
  },
  {
    id: 2,
    type: 'MARKET',
    title: 'Second Hand Items',
    description: '🛒 Great deals in marketplace',
    icon: '🛒',
    action: () => {
      if (trackUserBehavior) {
        trackUserBehavior('feed_click', 'SecondHandHome', { type: 'market' });
      }
      navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' }); // UPDATED
    }
  }
];

const getDefaultExploreSections = () => [
  {
    id: 1,
    title: '🍕 Food Delivery',
    subtitle: 'Order from campus restaurants',
    icon: 'restaurant',
    action: () => {
      if (trackUserBehavior) {
        trackUserBehavior('explore_click', 'FoodHome', { section: 'food' });
      }
      navigation.navigate('FoodStack', { screen: 'FoodHome' });
    },
    buttonText: 'Order now →'
  },
  {
    id: 2,
    title: '🛍️ E-Shop',
    subtitle: 'Campus online shopping',
    icon: 'cart',
    action: () => {
      if (trackUserBehavior) {
        trackUserBehavior('explore_click', 'EshopHome', { section: 'eshop' });
      }
      navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
    },
    buttonText: 'Shop now →'
  },
  {
    id: 3,
    title: '💕 LinkMe Dating',
    subtitle: 'Meet students on campus',
    icon: 'heart',
    action: () => {
      if (trackUserBehavior) {
        trackUserBehavior('explore_click', 'LinkMeEntry', { section: 'dating' });
      }
      navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
    },
    buttonText: 'Explore →'
  },
  {
    id: 4,
    title: '🏠 Find Roommates',
    subtitle: 'Connect with potential roommates',
    icon: 'people',
    action: () => {
      if (trackUserBehavior) {
        trackUserBehavior('explore_click', 'RoommateBrowse', { section: 'roommate' });
      }
      navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' }); // UPDATED
    },
    buttonText: 'Browse →'
  }
];

const getDefaultRecentlyViewed = () => [
  {
    id: 1,
    title: 'Food Vendors',
    description: 'Order your favorite meals',
    action: () => navigation.navigate('FoodStack', { screen: 'FoodHome' })
  },
  {
    id: 2,
    title: 'My School Portal',
    description: 'Access student portal',
    action: () => navigation.navigate('MySchoolNavigator', { screen: 'MySchoolHome' })
  },
  {
    id: 3,
    title: 'Marketplace',
    description: 'Buy and sell second-hand items',
    action: () => navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' }) // UPDATED
  },
  {
    id: 4,
    title: 'Local Services',
    description: 'Find campus service providers',
    action: () => navigation.navigate('Services', { screen: 'LocalServices' })
  }
];



const slideData = [
  {
    id: 1,
    title: "Welcome to MoiHub",
    subtitle: "Your campus companion for everything you need",
    image: require('../assets/hero.jpg'),
    backgroundColor: '#2C5F2D',
    buttonText: "Get Started",
    buttonAction: () => {
      // Navigate to Services (which is a tab) and go to ServicesList screen
      navigation.navigate('Services', { screen: 'ServicesList' });
    }
  },
  {
    id: 2,
    title: "Fast Food Delivery",
    subtitle: "Delicious meals delivered to your doorstep in minutes",
    image: require('../assets/food.png'),
    backgroundColor: '#1976D2',
    buttonText: "Order Now",
    buttonAction: () => {
      // FoodStack is defined in MainTabNavigator, navigate to FoodHome
      navigation.navigate('FoodStack', { screen: 'FoodHome' });
    }
  },
  {
    id: 3,
    title: "E-Shop Marketplace",
    subtitle: "Shop from campus stores online",
    image: require('../assets/hero.jpg'),
    backgroundColor: '#7B1FA2',
    buttonText: "Shop Now",
    buttonAction: () => {
      // Based on your navigation structure, this should navigate to EshopNavigator
      navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
    }
  },
  {
    id: 4,
    title: "LinkMe Dating",
    subtitle: "Find real connections within Moi University",
    image: require('../assets/linkmelogo.png'),
    backgroundColor: '#FF4081',
    buttonText: "Get Started",
    buttonAction: () => {
      // LinkMe is a separate navigator, navigate to LinkMeEntry
      navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
    }
  }
];


const serviceCategories = [
  { 
    title: "Emergency", 
    icon: "alert-circle-outline", 
    color: "#EF5350",
    onPress: () => {
      // Navigate to EmergencyServices which is in ServicesStackNavigator
      navigation.navigate('Services', { screen: 'EmergencyServices' });
    }
  },
  { 
    title: "Portal", 
    icon: "school-outline", 
    color: "#66BB6A",
    onPress: () => {
      // Navigate to MySchoolNavigator's MySchoolHome
      navigation.navigate('MySchoolNavigator', { screen: 'MySchoolHome' });
    }
  },
  { 
    title: "Food Delivery", 
    icon: "fast-food-outline", 
    color: "#42A5F5",
    onPress: () => {
      // Navigate to FoodStack's FoodHome
      navigation.navigate('FoodStack', { screen: 'FoodHome' });
    }
  },
  { 
    title: "Local Services", 
    icon: "bicycle-outline", 
    color: "#FFB300",
    onPress: () => {
      // Navigate to LocalServices which is in ServicesStackNavigator
      navigation.navigate('Services', { screen: 'LocalServices' });
    }
  }
];


  const loadCachedData = async () => {
    try {
      const cached = await DataService.getAppSetting('homescreen_cache');
      
      if (cached && cached.data && cached.timestamp) {
        setHomescreenData(cached.data);
        setLoading(false);
        
        const isCacheFresh = (Date.now() - cached.timestamp) < CACHE_DURATION;
        
        return { hasCache: true, isFresh: isCacheFresh };
      }
      
      return { hasCache: false, isFresh: false };
    } catch (error) {
      console.error('Error loading cached data:', error);
      return { hasCache: false, isFresh: false };
    }
  };

  // Fetch homescreen data from backend
  const fetchHomescreenData = async (showRefreshIndicator = false, forceRefresh = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      if (forceRefresh) setLoading(true);

      const response = await axios.get('https://moihub.onrender.com/api/homescreen', {
        timeout: 10000,
      });
      
      const data = response.data;
      setHomescreenData(data);
      
      await DataService.setAppSetting('homescreen_cache', {
        data,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Fetch homescreen failed:', error.message);
      
      if (!homescreenData) {
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

  useEffect(() => {
    const initializeData = async () => {
      const cacheResult = await loadCachedData();
      
      if (cacheResult.hasCache) {
        if (!cacheResult.isFresh) {
          fetchHomescreenData(false, false);
        }
      } else {
        await fetchHomescreenData(false, true);
      }

      await generatePersonalizedContent();
    };

    initializeData();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    fetchHomescreenData(true, false);
  }, []);

  // Auto-slide functionality
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
    }, 4000);

    return () => clearInterval(interval);
  }, [slideData.length]);

  // Ads carousel auto-slide
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
      }, 5000);

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


const handleHighlightPress = () => {
  if (!homescreenData?.highlight) return;

  const highlight = homescreenData.highlight;
  
  if (trackUserBehavior) {
    trackUserBehavior('highlight_click', 'Highlight', { 
      title: highlight.title,
      type: highlight.type 
    });
  }

  // NEW: If we have targetScreen and targetId, use them
  if (highlight.targetScreen && highlight.targetId) {
    navigation.navigate(highlight.targetScreen, { 
      id: highlight.targetId,
      ...(highlight.metadata || {})
    });
    return;
  }

  // OLD LOGIC: Fallback to type-based navigation
  const highlightType = highlight.type?.toUpperCase();
  
  if (highlightType === 'BLOG' || highlightType === 'ARTICLE' || highlightType === 'NEWS') {
    navigation.navigate('BlogsNavigator', { screen: 'Blogs' });
    return;
  }
  
  if (highlightType === 'FOOD' || highlightType === 'RESTAURANT') {
    navigation.navigate('FoodStack', { screen: 'FoodHome' });
    return;
  }
  
  if (highlightType === 'SHOP' || highlightType === 'MARKETPLACE' || highlightType === 'STORE') {
    navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
    return;
  }
  
  if (highlightType === 'DATING' || highlightType === 'MATCH' || highlightType === 'LINKME') {
    navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
    return;
  }
  
  if (highlightType === 'ROOMMATE' || highlightType === 'ACCOMMODATION' || highlightType === 'RENTAL') {
    navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' }); // UPDATED
    return;
  }
  
  if (highlightType === 'SECONDHAND' || highlightType === 'MARKET' || highlightType === 'SELL') {
    navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' }); // UPDATED
    return;
  }

  // Keyword fallback (same as before)
  const searchText = `${highlight.title} ${highlight.content || ''}`.toLowerCase();
  
  if (searchText.includes('blog') || searchText.includes('article') || 
      searchText.includes('news') || searchText.includes('campus') ||
      searchText.includes('event') || searchText.includes('update')) {
    navigation.navigate('BlogsNavigator', { screen: 'Blogs' });
  } else if (searchText.includes('food') || searchText.includes('restaurant') || 
             searchText.includes('delivery') || searchText.includes('meal')) {
    navigation.navigate('FoodStack', { screen: 'FoodHome' });
  } else if (searchText.includes('shop') || searchText.includes('buy') || 
             searchText.includes('store') || searchText.includes('product')) {
    navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
  } else if (searchText.includes('date') || searchText.includes('linkme') || 
             searchText.includes('meet') || searchText.includes('match')) {
    navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
  } else if (searchText.includes('room') || searchText.includes('rent') || 
             searchText.includes('accommodation') || searchText.includes('roommate')) {
    navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' }); // UPDATED
  } else if (searchText.includes('second') || searchText.includes('sell') || 
             searchText.includes('market') || searchText.includes('used')) {
    navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' }); // UPDATED
  } else {
    navigation.navigate('BlogsNavigator', { screen: 'Blogs' });
  }
};

const handleVendorCTAPress = () => {
  if (trackUserBehavior) {
    trackUserBehavior('vendor_cta_click', 'OnboardingNavigator', { 
      source: 'homescreen',
      type: 'vendor_onboarding' 
    });
  }
  
  // Navigate to the shared onboarding navigator for vendors
  navigation.navigate('OnboardingNavigator');
};

const handleAdPress = (ad) => {
  if (trackUserBehavior) {
    trackUserBehavior('ad_click', 'Ad', { 
      title: ad.title,
      adId: ad._id 
    });
  }

  const searchText = `${ad.title} ${ad.caption}`.toLowerCase();

  if (searchText.includes('food') || searchText.includes('restaurant') || searchText.includes('delivery')) {
    navigation.navigate('FoodStack', { screen: 'FoodHome' });
  } else if (searchText.includes('shop') || searchText.includes('buy') || searchText.includes('store')) {
    navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
  } else if (searchText.includes('rent') || searchText.includes('room') || searchText.includes('accommodation')) {
    navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' }); 
  } else if (searchText.includes('second') || searchText.includes('sell') || searchText.includes('market')) {
    navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' }); 
  } else if (searchText.includes('date') || searchText.includes('link') || searchText.includes('dating')) {
    navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
  } else {
    navigation.navigate('Services', { screen: 'ServicesList' });
  }
};

  const renderSlideItem = ({ item }) => (
    <View style={[styles.slideItem, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.slideContent}>
        <View style={styles.slideTextContainer}>
          <Animatable.Text 
            animation="fadeInDown" 
            duration={1200} 
            style={styles.slideTitle}
          >
            {item.title}
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeInDown"
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
  <TouchableOpacity style={styles.adItem} onPress={() => handleAdPress(item)}>
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
        onPress={() => handleAdPress(item)}
      >
        <Text style={styles.adButtonText}>Explore</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

  // Render Personalized Feed Item
  const renderFeedItem = ({ item }) => (
    <TouchableOpacity style={styles.feedItem} onPress={item.action}>
      <View style={styles.feedHeader}>
        <Text style={styles.feedType}>{item.icon} {item.type}</Text>
      </View>
      <Text style={styles.feedTitle}>{item.title}</Text>
      <Text style={styles.feedDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  // Render Explore Section Item
  const renderExploreItem = ({ item }) => (
    <TouchableOpacity style={styles.exploreItem} onPress={item.action}>
      <View style={styles.exploreContent}>
        <View style={styles.exploreHeader}>
          <Text style={styles.exploreTitle}>{item.title}</Text>
          <TouchableOpacity onPress={item.action}>
            <Text style={styles.exploreButtonText}>{item.buttonText}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.exploreSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render Recently Viewed Item
  const renderRecentItem = ({ item }) => (
    <TouchableOpacity style={styles.recentItem} onPress={item.action}>
      <View style={styles.recentContent}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>{item.title}</Text>
        </View>
        <Text style={styles.recentDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#02604c" barStyle="light-content" />
      
      <WhatsAppFAB />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
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


<TouchableOpacity 
  style={styles.notificationButton}
  onPress={() => navigation.navigate('Messages', { screen: 'ChatList' })}
>
  {iconsLoaded ? (
    <Ionicons name="notifications-outline" size={28} color="#2C5F2D" />
  ) : (
    <View style={{ width: 28, height: 28, backgroundColor: '#2C5F2D', borderRadius: 14 }} />
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
        {/* Interactive Slideshow */}
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

        {/* Service Categories */}
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

        {/* API-dependent content */}
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
                    {/* In the highlight section */}
<TouchableOpacity
  style={styles.highlightButton}
  onPress={handleHighlightPress}  // Make sure this is correct
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

           
          </>
        )}

        {/* Personalized Feed */}
        {personalizedFeed.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personalized Feed</Text>
            <View style={styles.feedContainer}>
              {personalizedFeed.map((item) => (
                <Animatable.View
                  key={item.id}
                  animation="fadeInUp"
                  duration={800}
                  delay={item.id * 200}
                >
                  {renderFeedItem({ item })}
                </Animatable.View>
              ))}
            </View>
          </View>
        )}

        {/* Explore Sections */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Explore Sections</Text>
          <View style={styles.exploreContainer}>
            {exploreSections.map((item) => (
              <Animatable.View
                key={item.id}
                animation="fadeInUp"
                duration={800}
                delay={item.id * 200}
              >
                {renderExploreItem({ item })}
              </Animatable.View>
            ))}
          </View>
        </View>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <View style={styles.recentContainer}>
              {recentlyViewed.map((item) => (
                <Animatable.View
                  key={item.id}
                  animation="fadeInUp"
                  duration={800}
                  delay={item.id * 200}
                >
                  {renderRecentItem({ item })}
                </Animatable.View>
              ))}
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
                      onPress={handleVendorCTAPress}
                    >
                      <Text style={styles.vendorCallButtonText}>Get Listed</Text>
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
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>About</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>Policy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>Version 1.0.1</Text>
          <Text style={styles.footerCopyright}>Made by Kylex</Text>
        </View>
      </ScrollView>
    </View>
  );
};


//  existing styles remain the same
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: 'ivory', 
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
  notificationButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 8,
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

  // Mission Styles
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

  // Highlight Styles
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
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

  // NEW: Personalized Feed Styles
  feedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#01604c',
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  feedDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // NEW: Explore Sections Styles
  exploreContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exploreItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exploreContent: {
    flex: 1,
  },
  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exploreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  exploreButtonText: {
    fontSize: 12,
    color: '#01604c',
    fontWeight: 'bold',
  },
  exploreSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // NEW: Recently Viewed Styles
  recentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentContent: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  recentDescription: {
    fontSize: 12,
    color: '#666',
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