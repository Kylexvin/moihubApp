import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import Theme from '../theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components } = Theme;

const OrganizationScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const contactAdminNumber = '254768610613';
  const defaultMessage = "Hello! I'm interested in adding my organization to MoiHub.";
  const API_URL = 'https://moihub.onrender.com/api/organizations';

  // Simple in-memory cache
  const [cache, setCache] = useState({
    organizations: [],
    lastUpdated: null
  });

  // Load from simple cache
  const loadCachedOrganizations = () => {
    if (cache.organizations.length > 0) {
      setOrganizations(cache.organizations);
      
      // If cache is less than 1 hour old, use it while fetching fresh data
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (cache.lastUpdated && cache.lastUpdated > oneHourAgo) {
        setLoading(false);
      }
    }
  };

  // Save to simple cache
  const saveOrganizationsToCache = (orgs) => {
    setCache({
      organizations: orgs,
      lastUpdated: Date.now()
    });
  };

  // Extract unique categories
  const getCategories = () => {
    const allOrgs = organizations.length > 0 ? organizations : cache.organizations;
    const uniqueCategories = [...new Set(allOrgs.map(org => org.category))].filter(Boolean);
    return ['All', ...uniqueCategories.sort()];
  };

  const categories = getCategories();

  // Fetch organizations from API
  const fetchOrganizations = useCallback(async () => {
    try {
      // Load cache first for immediate display
      if (organizations.length === 0) {
        loadCachedOrganizations();
      }
      
      const response = await axios.get(API_URL, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.data) {
        let fetchedOrgs = [];
        
        // Handle response formats
        if (Array.isArray(response.data)) {
          fetchedOrgs = response.data;
        } else if (response.data.data) {
          fetchedOrgs = response.data.data;
        } else if (response.data.organizations) {
          fetchedOrgs = response.data.organizations;
        }
        
        // Filter active organizations
        fetchedOrgs = fetchedOrgs.filter(org => org.isActive !== false);
        
        setOrganizations(fetchedOrgs);
        saveOrganizationsToCache(fetchedOrgs);
      }
    } catch (err) {
      // Use cached data if available
      if (cache.organizations.length > 0 && organizations.length === 0) {
        setOrganizations(cache.organizations);
      } else if (cache.organizations.length === 0) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
          [{ text: 'Retry', onPress: fetchOrganizations }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cache.organizations, organizations.length]);

  // Initial load
  useEffect(() => {
    loadCachedOrganizations();
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrganizations();
  };

  // Filter organizations
  const filteredOrganizations = selectedCategory === 'All' 
    ? organizations.filter(org => org.isActive !== false)
    : organizations.filter(org => 
        org.category === selectedCategory && org.isActive !== false
      );

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.activeCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const handleWhatsAppMessage = async (organization) => {
    const rawNumber = organization.phoneNumber || contactAdminNumber;
    const message = organization.whatsappMessage || 
      `Hello ${organization.name}! I found you on MoiHub and would like to learn more.`;

    // Format phone number
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('254')
      ? cleanNumber
      : `254${cleanNumber.replace(/^0/, '')}`;
    
    const encodedMessage = encodeURIComponent(message);
    const webWhatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

    // Try to open WhatsApp natively first
    try {
      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
      const canOpenNative = await Linking.canOpenURL('whatsapp://send');
      if (canOpenNative) {
        await Linking.openURL(whatsappUrl);
        return;
      }
    } catch (err) {
      // Continue to web version
    }

    // Fallback to WhatsApp Web
    try {
      await Linking.openURL(webWhatsappUrl);
    } catch (err) {
      Alert.alert(
        'WhatsApp Not Available',
        'WhatsApp could not be opened.',
        [
          {
            text: 'Copy Number',
            onPress: async () => {
              await Clipboard.setStringAsync(formattedNumber);
              Alert.alert('Copied!', 'Phone number copied to clipboard');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const openAdminWhatsApp = async () => {
    const formattedNumber = contactAdminNumber.startsWith('254')
      ? contactAdminNumber
      : `254${contactAdminNumber.replace(/^0/, '')}`;
    
    const encodedMessage = encodeURIComponent(defaultMessage);
    const webWhatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

    // Try native WhatsApp first
    try {
      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
      const canOpenNative = await Linking.canOpenURL('whatsapp://send');
      if (canOpenNative) {
        await Linking.openURL(whatsappUrl);
        return;
      }
    } catch (err) {
      // Continue to web version
    }

    // Fallback to WhatsApp Web
    try {
      await Linking.openURL(webWhatsappUrl);
    } catch (err) {
      Alert.alert(
        'WhatsApp Not Available',
        'WhatsApp could not be opened.',
        [
          {
            text: 'Copy Number',
            onPress: async () => {
              await Clipboard.setStringAsync(formattedNumber);
              Alert.alert('Copied!', 'Admin number copied to clipboard');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleOrganizationPress = (organization) => {
    navigation.navigate('OrganizationDetail', { 
      organization,
      organizationId: organization._id || organization.id
    });
  };

  const renderMeetingInfo = (organization) => {
    const { weeklyMeetingDay, meetingTime, meetingLocation } = organization;
    
    if (!weeklyMeetingDay || weeklyMeetingDay === 'N/A' || weeklyMeetingDay === 'Undisclosed') {
      return null;
    }

    return (
      <View style={styles.meetingInfoContainer}>
        <Ionicons name="time" size={14} color={Colors.textSecondary} />
        <Text style={styles.meetingInfoText}>
          {weeklyMeetingDay} at {meetingTime} • {meetingLocation}
        </Text>
      </View>
    );
  };

  // Loading state
  if (loading && organizations.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading organizations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Organizations</Text>
            <Text style={styles.headerSubtitle}>
              Discover campus clubs and societies {filteredOrganizations.length > 0 && `(${filteredOrganizations.length})`}
            </Text>
          </View>
        </View>
      </View>

      {renderCategoryTabs()}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Organizations Grid */}
        <View style={styles.organizationsContainer}>
          {filteredOrganizations.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="people" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No organizations found</Text>
              <Text style={styles.emptyStateText}>
                {selectedCategory === 'All' 
                  ? 'Check back later for new organizations'
                  : `No ${selectedCategory.toLowerCase()} organizations available`
                }
              </Text>
            </View>
          ) : (
            filteredOrganizations.map((org) => (
              <TouchableOpacity
                key={org._id || org.id}
                style={[styles.organizationCard, { 
                  backgroundColor: org.color ? `${org.color}20` : Colors.card 
                }]}
                onPress={() => handleOrganizationPress(org)}
                activeOpacity={0.7}
              >
                <View style={styles.orgHeader}>
                  <View style={styles.orgIconContainer}>
                    <Ionicons 
                      name={getOrganizationIcon(org.category)} 
                      size={28} 
                      color={Colors.text} 
                    />
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{org.category || 'General'}</Text>
                  </View>
                </View>
                
                <Text style={styles.orgName}>{org.name}</Text>
                <Text style={styles.orgDescription}>{org.description}</Text>
                
                {org.services && org.services.length > 0 && (
                  <View style={styles.servicesContainer}>
                    <Text style={styles.servicesTitle}>Services</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.servicesList}
                    >
                      {org.services.slice(0, 4).map((service, serviceIndex) => (
                        <View key={serviceIndex} style={styles.serviceTag}>
                          <Text style={styles.serviceText}>{service}</Text>
                        </View>
                      ))}
                      {org.services.length > 4 && (
                        <View style={styles.serviceTag}>
                          <Text style={styles.serviceText}>+{org.services.length - 4}</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
                
                {renderMeetingInfo(org)}
                
                <TouchableOpacity 
                  style={styles.whatsappButton}
                  onPress={() => handleWhatsAppMessage(org)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.whatsappButtonText}>Contact via WhatsApp</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Join Section */}
        <View style={styles.joinSection}>
          <View style={styles.joinIcon}>
            <Ionicons name="add-circle" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.joinTitle}>Add Your Organization</Text>
          <Text style={styles.joinText}>
            Get your campus club or society featured on MoiHub
          </Text>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={openAdminWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
            <Text style={styles.joinButtonText}>Contact Admin</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get icon based on category
const getOrganizationIcon = (category) => {
  const iconMap = {
    'Academic': 'school',
    'Sports': 'football',
    'Cultural': 'color-palette',
    'Religious': 'heart',
    'Technical': 'code-slash',
    'Entrepreneurship': 'business',
    'Community': 'people',
    'Social': 'people',
    'Professional': 'briefcase',
    'Environmental': 'leaf',
    'Health': 'medkit',
    'Arts': 'brush',
    'Music': 'musical-notes',
    'Debate': 'megaphone',
    'Default': 'people'
  };
  
  return iconMap[category] || iconMap['Default'];
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  
  // Header Styles
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  
  // Category Tabs
  categoryContainer: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.background,
  },
  activeCategoryTab: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  activeCategoryText: {
    color: Colors.black,
  },
  
  // Scroll Content
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  
  // Organizations Container
  organizationsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  
  // Organization Card
  organizationCard: {
    ...Components.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orgIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  orgName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  orgDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  
  // Services
  servicesContainer: {
    marginBottom: Spacing.md,
  },
  servicesTitle: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  servicesList: {
    flexDirection: 'row',
  },
  serviceTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  serviceText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  
  // Meeting Info
  meetingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    gap: Spacing.xs,
  },
  meetingInfoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  
  // WhatsApp Button
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  whatsappButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  
  // Join Section
  joinSection: {
    ...Components.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  joinIcon: {
    marginBottom: Spacing.md,
  },
  joinTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  joinText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: '60%',
  },
  joinButtonText: {
    ...Typography.caption,
    color: Colors.black,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  
  // Loading States
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  
  // Empty State
  emptyStateContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyStateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  
  // Footer Space
  footerSpace: {
    height: Spacing.xl,
  },
});

export default OrganizationScreen;