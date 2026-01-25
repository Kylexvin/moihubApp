// screens/localservices/ProviderProfile.js
import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../theme/Theme';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

// Dummy data based on your format
const dummyData = {
  header: {
    coverImage: null,
    name: "Grace Beauty Salon & Spa",
    rating: 0,
    totalReviews: 0,
    location: "123 Westlands Road, Nairobi (Next to Westgate Mall)",
    phone: "0712345678",
    status: {
      isOpen: true,
      closesAt: "19:00",
      display: "Open • Closes 7:00 PM"
    }
  },
  actions: {
    primary: [
      {
        type: "book_now",
        enabled: true,
        label: "Book Now"
      },
      {
        type: "chat",
        enabled: true,
        label: "Chat"
      },
      {
        type: "call",
        enabled: true,
        phone: "0712345678",
        label: "Call"
      }
    ],
    secondary: [
      {
        type: "save",
        enabled: true,
        label: "Save",
        isSaved: false
      },
      {
        type: "share",
        enabled: true,
        label: "Share"
      }
    ]
  },
  tabs: {
    services: {
      count: 0,
      hasData: false
    },
    products: {
      count: 0,
      hasData: false
    },
    reviews: {
      count: 0,
      average: 0,
      hasData: false
    },
    info: {
      hasData: true
    }
  },
  userContext: {
    hasBookedBefore: null,
    canBookAgain: null
  },
  stats: {
    services: 0,
    products: 0,
    totalBookings: 0,
    yearsInBusiness: 1
  },
  metadata: {
    providerId: "696f5c296e2eed6518b9b3aa",
    categoryId: "696f5afa5f8178760e668aeb",
    categoryName: "Test",
    isDashboard: true,
    canBook: true,
    tabs: ["services", "products", "reviews", "info"]
  }
};

const ProviderProfile = ({ route, navigation }) => {
  const { providerName, categoryName, categoryColor } = route.params || {};
  const [data, setData] = useState(dummyData);
  const [activeTab, setActiveTab] = useState('info');
  const [isSaved, setIsSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const providerColor = categoryColor || Colors.primary;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: providerName || data.header.name,
      headerStyle: {
        backgroundColor: providerColor,
      },
      headerTintColor: Colors.text,
      headerTitleStyle: {
        ...Typography.h4,
        fontWeight: '600',
      },
      headerBackTitleVisible: false,
    });
  }, [navigation, providerName, providerColor]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleActionPress = async (action) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (action.type) {
      case 'book_now':
        Alert.alert('Booking', 'Booking functionality coming soon!');
        break;
        
      case 'chat':
        const whatsappUrl = `https://wa.me/254${data.header.phone.substring(1)}?text=Hi ${encodeURIComponent(data.header.name)}, I found you on MoiHub Services!`;
        try {
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            await Linking.openURL(whatsappUrl);
          } else {
            Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature');
          }
        } catch (error) {
          console.error('WhatsApp failed:', error);
        }
        break;
        
      case 'call':
        const phoneUrl = `tel:${data.header.phone}`;
        try {
          const canOpen = await Linking.canOpenURL(phoneUrl);
          if (canOpen) {
            await Linking.openURL(phoneUrl);
          } else {
            Alert.alert('Call Not Supported', 'Phone number copied to clipboard');
          }
        } catch (error) {
          console.error('Call failed:', error);
        }
        break;
        
      case 'save':
        setIsSaved(!isSaved);
        Alert.alert('Success', isSaved ? 'Removed from saved' : 'Saved to favorites');
        break;
        
      case 'share':
        await handleShare();
        break;
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://moihub.com/provider/${data.metadata.providerId}`;
      const result = await Share.share({
        message: `Check out ${data.header.name} on MoiHub Services!\n${data.header.location}\nPhone: ${data.header.phone}\n\n${shareUrl}`,
        title: data.header.name,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Cover Image */}
      <LinearGradient
        colors={[providerColor, providerColor + 'CC']}
        style={styles.coverImage}
      >
        <Ionicons name="business" size={80} color={Colors.text + '80'} />
      </LinearGradient>
      
      {/* Business Info */}
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{data.header.name}</Text>
        
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star-outline"
                size={16}
                color={Colors.textSecondary}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            No reviews yet
          </Text>
        </View>
        
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: data.header.status.isOpen ? Colors.success : Colors.error }]} />
          <Text style={styles.statusText}>{data.header.status.display}</Text>
        </View>
        
        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={Colors.textSecondary} />
          <Text style={styles.locationText}>{data.header.location}</Text>
        </View>
        
        {/* Phone */}
        <View style={styles.phoneRow}>
          <Ionicons name="call" size={16} color={Colors.textSecondary} />
          <Text style={styles.phoneText}>{data.header.phone}</Text>
        </View>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{data.stats.services}</Text>
        <Text style={styles.statLabel}>Services</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{data.stats.products}</Text>
        <Text style={styles.statLabel}>Products</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{data.stats.totalBookings}</Text>
        <Text style={styles.statLabel}>Bookings</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{data.stats.yearsInBusiness}</Text>
        <Text style={styles.statLabel}>Year{data.stats.yearsInBusiness !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );

  const renderPrimaryActions = () => (
    <View style={styles.primaryActionsContainer}>
      {data.actions.primary.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.primaryActionButton,
            action.type === 'book_now' && { backgroundColor: providerColor },
            action.type === 'chat' && { backgroundColor: '#25D366' },
            action.type === 'call' && { backgroundColor: Colors.success },
          ]}
          onPress={() => handleActionPress(action)}
          disabled={!action.enabled}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              action.type === 'book_now' ? 'calendar' :
              action.type === 'chat' ? 'chatbubble' :
              'call'
            }
            size={20}
            color={Colors.text}
          />
          <Text style={styles.primaryActionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSecondaryActions = () => (
    <View style={styles.secondaryActionsContainer}>
      {data.actions.secondary.map((action, index) => {
        const isSaveAction = action.type === 'save';
        return (
          <TouchableOpacity
            key={index}
            style={styles.secondaryActionButton}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                isSaveAction ? (isSaved ? 'bookmark' : 'bookmark-outline') :
                'share-social'
              }
              size={22}
              color={isSaveAction && isSaved ? Colors.warning : Colors.primary}
            />
            <Text style={styles.secondaryActionText}>
              {isSaveAction && isSaved ? 'Saved' : action.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {data.metadata.tabs.map((tab) => {
        const tabData = data.tabs[tab];
        const isActive = activeTab === tab;
        
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {tabData.count > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tabData.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'services':
        return (
          <View style={styles.tabContent}>
            <Ionicons name="construct" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTabTitle}>No Services Available</Text>
            <Text style={styles.emptyTabText}>
              This provider hasn't added any services yet.
            </Text>
          </View>
        );
        
      case 'products':
        return (
          <View style={styles.tabContent}>
            <Ionicons name="cube" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTabTitle}>No Products Available</Text>
            <Text style={styles.emptyTabText}>
              This provider hasn't added any products yet.
            </Text>
          </View>
        );
        
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            <Ionicons name="chatbubble" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTabTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyTabText}>
              Be the first to review this provider!
            </Text>
            <TouchableOpacity style={styles.leaveReviewButton}>
              <Text style={styles.leaveReviewText}>Leave a Review</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'info':
        return (
          <View style={styles.infoContent}>
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>About</Text>
              <Text style={styles.infoText}>
                {data.header.name} is a professional service provider in the {categoryName || data.metadata.categoryName} category. 
                They have been serving customers for {data.stats.yearsInBusiness} year{data.stats.yearsInBusiness !== 1 ? 's' : ''}.
              </Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Contact Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="call" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoRowText}>{data.header.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoRowText}>{data.header.location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoRowText}>Closes at {data.header.status.closesAt}</Text>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Business Hours</Text>
              <View style={styles.hoursRow}>
                <Text style={styles.dayText}>Monday - Friday</Text>
                <Text style={styles.timeText}>8:00 AM - 7:00 PM</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.dayText}>Saturday</Text>
                <Text style={styles.timeText}>9:00 AM - 5:00 PM</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.dayText}>Sunday</Text>
                <Text style={styles.timeText}>Closed</Text>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Categories</Text>
              <View style={styles.categoriesContainer}>
                <View style={[styles.categoryTag, { backgroundColor: providerColor + '20' }]}>
                  <Text style={[styles.categoryTagText, { color: providerColor }]}>
                    {categoryName || data.metadata.categoryName}
                  </Text>
                </View>
                <View style={[styles.categoryTag, { backgroundColor: Colors.secondary + '20' }]}>
                  <Text style={[styles.categoryTagText, { color: Colors.secondary }]}>
                    Beauty & Spa
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" backgroundColor={providerColor} />
      
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {renderHeader()}
        {renderStats()}
        {renderPrimaryActions()}
        {renderSecondaryActions()}
        {renderTabs()}
        {renderTabContent()}
        
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  
  // Header
  headerContainer: {
    backgroundColor: Colors.card,
    marginBottom: Spacing.md,
  },
  coverImage: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessInfo: {
    padding: Spacing.lg,
  },
  businessName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.round,
  },
  statusText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phoneText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Stats
  statsContainer: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Shadows.small,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.cardBorder,
  },
  
  // Actions
  primaryActionsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  primaryActionText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  secondaryActionButton: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  secondaryActionText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 12,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.text,
  },
  tabBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '700',
  },
  
  // Tab Content
  tabContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  emptyTabTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyTabText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  leaveReviewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  leaveReviewText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Info Tab Content
  infoContent: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoSectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoRowText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  dayText: {
    ...Typography.body,
    color: Colors.text,
  },
  timeText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Footer
  footerSpace: {
    height: Spacing.xxxl,
  },
});

export default ProviderProfile; 