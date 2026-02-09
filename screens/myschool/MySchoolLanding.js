import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ImageBackground,
  Animated,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../theme/Theme';
import ServiceTrackingService from '../../services/ServiceTrackingService';

const { width } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius } = Theme;

// Background image
const BACKGROUND_IMAGE = require('../../assets/moiunny.jpg');

const MySchoolLanding = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animated values for header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  // All services combined
  const allServices = [
    // University Services
    {
      id: "student_portal",
      name: 'Student Portal',
      description: 'Academic records and grades',
      icon: 'school-outline',
      url: 'https://portal.mu.ac.ke/',
      color: Colors.success,
      bgColor: Colors.success + '20',
      tab: 'university',
      priority: 1
    },
        {
      id: "past_papers",
      name: 'Past Papers',
      description: 'Browse past exam papers',
      icon: 'documents-outline',
      url: 'https://moilearn.vercel.app',
      color: Colors.success,
      bgColor: Colors.success + '20',
      tab: 'resources',
      priority: 2
    },
    {
      id: "admissions",
      name: 'Admissions',
      description: 'Admissions and enrollment',
      icon: 'document-text-outline',
      url: 'https://admissions.mu.ac.ke/',
      color: Colors.accent,
      bgColor: Colors.accent + '20',
      tab: 'university',
      priority: 2
    },
    {
      id: "musomi",
      name: 'Musomi Learning',
      description: 'E-learning platform',
      icon: 'library-outline',
      url: 'https://elearning.mu.ac.ke/',
      color: Colors.info,
      bgColor: Colors.info + '20',
      tab: 'university',
      priority: 3
    },
    {
      id: "website",
      name: 'University Website',
      description: 'Official website',
      icon: 'globe-outline',
      url: 'https://www.mu.ac.ke/',
      color: Colors.warning,
      bgColor: Colors.warning + '20',
      tab: 'university',
      priority: 4
    },
    

    // Student Resources
    {
      id: "organizations",
      name: 'Organizations',
      description: 'Clubs and societies',
      icon: 'people-outline',
      screen: 'Organizations',
      color: Colors.accent,
      bgColor: Colors.accent + '20',
      tab: 'resources',
      priority: 1
    },

    {
      id: "helf",
      name: 'HEF/HELB Loans',
      description: 'Student loans portal',
      icon: 'cash-outline',
      url: 'https://portal.hef.co.ke/auth/signin',
      color: Colors.success,
      bgColor: Colors.success + '20',
      tab: 'resources',
      priority: 3
    },
    

    // Academic Tools
    
    {
      id: "support",
      name: 'IT Support',
      description: 'Technical support desk',
      icon: 'headset-outline',
      url: 'https://mu.ac.ke/index.php/contact/',
      color: Colors.warning,
      bgColor: Colors.warning + '20',
      tab: 'tools',
      priority: 8
    },
  ];

  const filteredServices = allServices.filter(service => 
    activeTab === 'all' ? true : service.tab === activeTab
  );

  const tabs = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'university', label: 'University', icon: 'school-outline' },
    { id: 'resources', label: 'Resources', icon: 'library-outline' },
    { id: 'tools', label: 'Tools', icon: 'hammer-outline' },
  ];

  const handleServicePress = async (service) => {
    try {
      // Track service usage
      if (service.id) {
        await ServiceTrackingService.trackServiceUsage(
          service.id,
          service.name,
          service.tab || 'general'
        );
      }

      if (service.url) {
        await WebBrowser.openBrowserAsync(service.url, {
          toolbarColor: Colors.primary,
          controlsColor: '#FFFFFF',
          secondaryToolbarColor: Colors.primaryDark,
          enableDefaultShareMenuItem: true,
        });
      } else if (service.screen) {
        navigation.navigate(service.screen);
      }
    } catch (error) {
      Alert.alert(
        'Unable to Open',
        'Please check your internet connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

const renderBackgroundImage = () => (
  <Animated.View style={[styles.backgroundImageContainer, { opacity: headerOpacity }]}>
    <ImageBackground
      source={BACKGROUND_IMAGE}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(9, 48, 40, 0.3)',
          'rgba(9, 48, 40, 0.5)',
          'rgba(9, 48, 40, 0.7)',
          'rgba(9, 48, 40, 0.85)'
        ]}
        style={styles.imageGradient}
      />
    </ImageBackground>
  </Animated.View>
);

  const renderServiceCard = (service) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceCard}
      onPress={() => handleServicePress(service)}
      activeOpacity={0.7}
    >
      <View style={[styles.serviceIconContainer, { backgroundColor: service.bgColor }]}>
        <Ionicons name={service.icon} size={24} color={service.color} />
      </View>
      
      <View style={styles.serviceContent}>
        <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {service.description}
        </Text>
      </View>
      
      <Ionicons 
        name={service.url ? "open-outline" : "chevron-forward"} 
        size={16} 
        color={Colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  const renderTabBar = () => (
    <View style={styles.tabBarContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon} 
              size={16} 
              color={activeTab === tab.id ? Colors.primary : Colors.textSecondary} 
              style={styles.tabIcon}
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStatsBar = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{allServices.length}</Text>
        <Text style={styles.statLabel}>Services</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>24/7</Text>
        <Text style={styles.statLabel}>Access</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>100%</Text>
        <Text style={styles.statLabel}>Free</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {renderBackgroundImage()}
      
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with background image */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Text style={styles.schoolName}>Moi University</Text>
            <Text style={styles.schoolTagline}>Student Services Portal</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {renderStatsBar()}
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Services</Text>
              <Text style={styles.sectionSubtitle}>
                Everything you need in one place
              </Text>
            </View>
          </View>

          {/* Filter tabs */}
          {renderTabBar()}
          
          {/* Services grid - only show filtered services */}
          <View style={styles.servicesGrid}>
            {filteredServices.length > 0 ? (
              filteredServices.map(renderServiceCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>No services found</Text>
                <Text style={styles.emptyStateSubtext}>Try selecting a different category</Text>
              </View>
            )}
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Need Help?</Text>
              <Text style={styles.infoText}>
                Contact ICT Department or visit the help center for assistance
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  headerSection: {
    minHeight: 250,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    marginBottom: Spacing.lg,
  },
  schoolName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  schoolTagline: {
    fontSize: 16,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

imageGradient: {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
},


  contentContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -BorderRadius.xl,
    paddingTop: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.cardBorder,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  tabBarContainer: {
    marginBottom: Spacing.xl,
  },
  tabBar: {
    paddingHorizontal: Spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  activeTabButton: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  tabIcon: {
    marginRight: Spacing.xs,
  },
  tabLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: Colors.primary,
  },
  servicesGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  serviceContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  serviceName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  serviceDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginTop: Spacing.xl,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
});

export default MySchoolLanding;