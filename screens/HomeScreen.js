import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import WhatsAppFAB from './WhatsAppFAB';
import DataService from '../services/DataService';

import ServicesShowcase from './components/ServicesShowcase';
import MarketplaceShowcase from './components/MarketplaceShowcase';

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

const HomeScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef(null);
  const adsRef = useRef(null);
  const isMountedRef = useRef(true);

  // Backend data states
  const [homescreenData, setHomescreenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAdSlide, setCurrentAdSlide] = useState(0);

  // Showcase states
  const [marketplaceShowcase, setMarketplaceShowcase] = useState([]);
  const [servicesShowcase, setServicesShowcase] = useState([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);

  // Explore sections (personalized feed + recently viewed folded in / removed)
  const [exploreSections, setExploreSections] = useState([]);
  const [iconsLoaded, setIconsLoaded] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  const trackUserBehavior = useCallback(async (action, screen, metadata = {}) => {
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
  }, [currentUser]);

  const getDefaultExploreSections = useCallback(() => [
    {
      id: 1,
      title: 'Food Delivery',
      subtitle: 'Order from campus restaurants',
      icon: 'restaurant',
      action: () => {
        trackUserBehavior('explore_click', 'FoodHome', { section: 'food' });
        navigation.navigate('FoodStack', { screen: 'FoodHome' });
      },
      buttonText: 'Order now →'
    },
    {
      id: 2,
      title: 'E-Shop',
      subtitle: 'Campus online shopping',
      icon: 'cart',
      action: () => {
        trackUserBehavior('explore_click', 'EshopHome', { section: 'eshop' });
        navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
      },
      buttonText: 'Shop now →'
    },
    {
      id: 3,
      title: 'LinkMe Dating',
      subtitle: 'Meet students on campus',
      icon: 'heart',
      action: () => {
        trackUserBehavior('explore_click', 'LinkMeEntry', { section: 'dating' });
        navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
      },
      buttonText: 'Explore →'
    },
    {
      id: 4,
      title: 'Find Roommates',
      subtitle: 'Connect with potential roommates',
      icon: 'people',
      action: () => {
        trackUserBehavior('explore_click', 'RoommateBrowse', { section: 'roommate' });
        navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' });
      },
      buttonText: 'Browse →'
    },
    {
      id: 5,
      title: 'Campus Events',
      subtitle: 'Latest campus updates',
      icon: 'newspaper',
      action: () => {
        trackUserBehavior('explore_click', 'Blogs', { section: 'blog' });
        navigation.navigate('BlogsNavigator', { screen: 'Blogs' });
      },
      buttonText: 'Read more →'
    },
    {
      id: 6,
      title: 'Second Hand Items',
      subtitle: 'Great deals in marketplace',
      icon: 'pricetag',
      action: () => {
        trackUserBehavior('explore_click', 'SecondHandHome', { section: 'market' });
        navigation.navigate('SecondHandStack');
      },
      buttonText: 'Browse →'
    }
  ], [trackUserBehavior, navigation]);

  const generatePersonalizedContent = useCallback(() => {
    setExploreSections(getDefaultExploreSections());
  }, [getDefaultExploreSections]);

  const fetchShowcases = useCallback(async () => {
    try {
      setShowcaseLoading(true);
      const [marketplaceRes, servicesRes] = await Promise.all([
        axios.get('/api/marketplace/showcase'),
        axios.get('/api/services/showcase')
      ]);

      if (!isMountedRef.current) return;
      setMarketplaceShowcase(marketplaceRes.data.showcaseItems || []);
      setServicesShowcase(servicesRes.data.showcaseItems || []);
    } catch (error) {
      console.error('Failed to fetch showcases:', error);
    } finally {
      if (isMountedRef.current) setShowcaseLoading(false);
    }
  }, []);

  const slideData = useMemo(() => [
    {
      id: 1,
      title: "Welcome to MoiHub",
      subtitle: "Your campus companion for everything you need",
      image: require('../assets/moiunny.jpg'),
      backgroundColor: '#2C5F2D',
      buttonText: "Get Started",
      buttonAction: () => {
        navigation.navigate('ServicesStack', { screen: 'ServicesList' });
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
        navigation.navigate('FoodStack', { screen: 'FoodHome' });
      }
    },
    {
      id: 3,
      title: "E-Shop Marketplace",
      subtitle: "Shop from campus stores online",
      image: require('../assets/moiunny.jpg'),
      backgroundColor: '#7B1FA2',
      buttonText: "Shop Now",
      buttonAction: () => {
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
        navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
      }
    }
  ], [navigation]);

  const serviceCategories = useMemo(() => [
    {
      title: "Emergency",
      icon: "alert-circle-outline",
      color: "#EF5350",
      onPress: () => {
        navigation.navigate('ServicesStack', { screen: 'EmergencyServices' });
      }
    },
    {
      title: "Portal",
      icon: "school-outline",
      color: "#66BB6A",
      onPress: () => {
        navigation.navigate('MySchoolNavigator', { screen: 'MySchoolHome' });
      }
    },
    {
      title: "Food Delivery",
      icon: "fast-food-outline",
      color: "#42A5F5",
      onPress: () => {
        navigation.navigate('FoodStack', { screen: 'FoodHome' });
      }
    },
    {
      title: "Local Services",
      icon: "bicycle-outline",
      color: "#FFB300",
      onPress: () => {
        navigation.navigate('ServicesStack', { screen: 'LocalServices' });
      }
    }
  ], [navigation]);

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

  const fetchHomescreenData = async (showRefreshIndicator = false, forceRefresh = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      if (forceRefresh) setLoading(true);

      const response = await axios.get('/api/homescreen', {
        timeout: 10000,
      });

      if (!isMountedRef.current) return;

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
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
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

      generatePersonalizedContent();
      fetchShowcases();
    };

    initializeData();
  }, []);

  const onRefresh = useCallback(() => {
    fetchHomescreenData(true, false);
    fetchShowcases();
  }, []);

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

    trackUserBehavior('highlight_click', 'Highlight', {
      title: highlight.title,
      type: highlight.type
    });

    if (highlight.targetScreen && highlight.targetId) {
      navigation.navigate(highlight.targetScreen, {
        id: highlight.targetId,
        ...(highlight.metadata || {})
      });
      return;
    }

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
      navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' });
      return;
    }

    if (highlightType === 'SECONDHAND' || highlightType === 'MARKET' || highlightType === 'SELL') {
      navigation.navigate('SecondHandStack');
      return;
    }

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
      navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' });
    } else if (searchText.includes('second') || searchText.includes('sell') ||
               searchText.includes('market') || searchText.includes('used')) {
      navigation.navigate('SecondHandStack');
    } else {
      navigation.navigate('BlogsNavigator', { screen: 'Blogs' });
    }
  };

  const handleVendorCTAPress = () => {
    trackUserBehavior('vendor_cta_click', 'OnboardingNavigator', {
      source: 'homescreen',
      type: 'vendor_onboarding'
    });

    navigation.navigate('OnboardingNavigator');
  };

  const handleAdPress = (ad) => {
    trackUserBehavior('ad_click', 'Ad', {
      title: ad.title,
      adId: ad._id
    });

    const searchText = `${ad.title} ${ad.caption}`.toLowerCase();

    if (searchText.includes('food') || searchText.includes('restaurant') || searchText.includes('delivery')) {
      navigation.navigate('FoodStack', { screen: 'FoodHome' });
    } else if (searchText.includes('shop') || searchText.includes('buy') || searchText.includes('store')) {
      navigation.navigate('EshopNavigator', { screen: 'EshopHome' });
    } else if (searchText.includes('rent') || searchText.includes('room') || searchText.includes('accommodation')) {
      navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' });
    } else if (searchText.includes('second') || searchText.includes('sell') || searchText.includes('market')) {
      navigation.navigate('SecondHandStack');
    } else if (searchText.includes('date') || searchText.includes('link') || searchText.includes('dating')) {
      navigation.navigate('LinkMe', { screen: 'LinkMeEntry' });
    } else {
      navigation.navigate('ServicesStack', { screen: 'ServicesList' });
    }
  };

  const renderSlideItem = ({ item }) => (
    <View style={[styles.slideItem, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.slideContent}>
        <View style={styles.slideTextContainer}>
          <Animatable.Text animation="fadeInDown" duration={1200} style={styles.slideTitle}>
            {item.title}
          </Animatable.Text>
          <Animatable.Text animation="fadeInDown" duration={1200} delay={300} style={styles.slideSubtitle}>
            {item.subtitle}
          </Animatable.Text>
          <TouchableOpacity style={styles.slideButton} onPress={item.buttonAction}>
            <Text style={styles.slideButtonText}>{item.buttonText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.slideImageContainer}>
          <Image source={item.image} style={styles.slideImage} resizeMode="cover" />
        </View>
      </View>
    </View>
  );

  const renderAdItem = ({ item }) => (
    <TouchableOpacity style={styles.adItem} onPress={() => handleAdPress(item)}>
      <Image source={{ uri: item.imageUrl }} style={styles.adImage} resizeMode="cover" />
      <View style={styles.adOverlay}>
        <Text style={styles.adTitle}>{item.title}</Text>
        <Text style={styles.adCaption}>{item.caption}</Text>
        <TouchableOpacity style={styles.adButton} onPress={() => handleAdPress(item)}>
          <Text style={styles.adButtonText}>Explore</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderExploreItem = ({ item }) => (
    <TouchableOpacity style={styles.exploreItem} onPress={item.action}>
      <View style={styles.exploreIconContainer}>
        <Ionicons name={item.icon} size={20} color="#01604c" />
      </View>
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

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#02604c" barStyle="light-content" />

      <WhatsAppFAB />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoTextContainer}>
            <Image source={require('../assets/moihublogo.png')} style={styles.logo} resizeMode="contain" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Slideshow */}
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

        {loading ? (
          <View style={styles.loadingContentContainer}>
            <ActivityIndicator size="large" color="#01604c" />
            <Text style={styles.loadingText}>Loading personalized content...</Text>
          </View>
        ) : (
          <>
            {/* Today's Mission */}
            {homescreenData?.todaysMission && (
              <View style={styles.sectionContainer}>
                <Animatable.View animation="fadeInUp" delay={500} duration={1000} style={styles.missionContainer}>
                  <LinearGradient
                    colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
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
                      <Text style={styles.missionFooterText}>You've got this!</Text>
                    </View>
                  </LinearGradient>
                </Animatable.View>
              </View>
            )}

            {/* Services Showcase */}
            {servicesShowcase.length > 0 && (
              <View style={styles.sectionContainer}>
                <ServicesShowcase items={servicesShowcase} loading={showcaseLoading} navigation={navigation} />
              </View>
            )}

            {/* Highlight */}
            {homescreenData?.highlight && (
              <View style={styles.sectionContainer}>
                <Animatable.View animation="fadeInUp" delay={600} duration={1000} style={styles.highlightContainer}>
                  {homescreenData.highlight.graphicUrl && (
                    <View style={styles.highlightImageContainer}>
                      <Image
                        source={{ uri: homescreenData.highlight.graphicUrl }}
                        style={styles.highlightImage}
                        resizeMode="cover"
                      />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.highlightImageOverlay} />
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
                    <TouchableOpacity style={styles.highlightButton} onPress={handleHighlightPress}>
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

            {/* Marketplace Showcase */}
            {marketplaceShowcase.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.showcaseHeader}>
                  <Text style={styles.sectionTitle}>Trending in Marketplace</Text>
                  <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('SecondHandStack')}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="arrow-forward" size={14} color="#01604c" />
                  </TouchableOpacity>
                </View>
                <MarketplaceShowcase items={marketplaceShowcase} loading={showcaseLoading} navigation={navigation} />
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

            {/* Explore Sections */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Explore Sections</Text>
              <View style={styles.exploreContainer}>
                {exploreSections.map((item) => (
                  <Animatable.View key={item.id} animation="fadeInUp" duration={800} delay={item.id * 200}>
                    {renderExploreItem({ item })}
                  </Animatable.View>
                ))}
              </View>
            </View>

            {/* Vendor Call to Action - always visible */}
            <View style={styles.sectionContainer}>
              <Animatable.View animation="fadeInUp" delay={700} duration={1000} style={styles.vendorCallContainer}>
                <View style={styles.vendorCallContent}>
                  {iconsLoaded ? (
                    <Ionicons name="business" size={32} color="#FFFFFF" style={styles.vendorCallIcon} />
                  ) : (
                    <View style={{ width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 16, marginBottom: 10 }} />
                  )}
                  <Text style={styles.vendorCallTitle}>List Your Business on MoiHub</Text>
                  <Text style={styles.vendorCallText}>
                    Reach thousands of students. Get your business listed today!
                  </Text>
                  <TouchableOpacity style={styles.vendorCallButton} onPress={handleVendorCTAPress}>
                    <Text style={styles.vendorCallButtonText}>Become a Vendor</Text>
                    {iconsLoaded ? (
                      <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
                    ) : (
                      <View style={{ width: 16, height: 16, backgroundColor: 'rgba(76,175,80,0.3)', borderRadius: 8 }} />
                    )}
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            </View>
          </>
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
          <Text style={styles.footerText}>Version 1.1.0</Text>
          <Text style={styles.footerCopyright}>✟𝗞𝗬𝗟𝗘𝗫✟</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0e1',
  },
  header: {
    backgroundColor: '#edeedf',
    paddingTop: 8,
    paddingBottom: 10,
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
    marginBottom: 8,
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
    marginTop: 0,
  },
  notificationButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 8,
  },

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

  loadingContentContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 15,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },

  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },

  showcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#01604c',
    marginRight: 4,
  },

  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#000',
  },

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
    padding: 15,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  missionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  missionFooterText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },

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
    height: 140,
  },
  highlightImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  highlightContent: {
    padding: 15,
  },
  highlightTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
    marginBottom: 10,
    lineHeight: 20,
  },
  highlightButton: {
    backgroundColor: '#01604c',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
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

  vendorCallContainer: {
    backgroundColor: '#01604c',
    borderRadius: 12,
    padding: 12,
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
    marginBottom: 4,
    textAlign: 'center',
  },
  vendorCallText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 18,
  },
  vendorCallButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorCallButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },

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
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exploreIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exploreContent: {
    flex: 1,
  },
  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    lineHeight: 18,
  },

  footer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  footerDivider: {
    fontSize: 12,
    color: '#7F8C8D',
    marginHorizontal: 6,
  },
  footerText: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 1,
  },
  footerCopyright: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 3,
  },
});

export default HomeScreen;