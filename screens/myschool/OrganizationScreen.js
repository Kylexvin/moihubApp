import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

const { width } = Dimensions.get('window');

const OrganizationScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const contactAdminNumber = '254768610613';
  const defaultMessage = "Hello, I would like to add my organization to your platform.";

  // Extract unique categories from organizations data
  const getCategories = () => {
    const uniqueCategories = [...new Set(organizations.map(org => org.category))];
    return ['All', ...uniqueCategories];
  };

  const categories = getCategories();

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/organizations');
      
      if (response.data.success) {
        setOrganizations(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch organizations');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load organizations');
      
      // Show error alert
      Alert.alert(
        'Error',
        'Failed to load organizations. Please check your internet connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => fetchOrganizations(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrganizations();
  };

  // Filter organizations based on selected category
  const filteredOrganizations = selectedCategory === 'All' 
    ? organizations.filter(org => org.isActive !== false) // Only show active organizations
    : organizations.filter(org => org.category === selectedCategory && org.isActive !== false);

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
  const rawNumber = organization.phoneNumber || '254768610613';
  const message = organization.whatsappMessage || `Hello! I'm interested in learning more about ${organization.name}.`;

  // Clean and format phone number
  const cleanNumber = rawNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('254')
    ? cleanNumber
    : `254${cleanNumber.replace(/^0/, '')}`;
  
  const encodedMessage = encodeURIComponent(message);

  // Try to open WhatsApp natively
  try {
    const canOpenNative = await Linking.canOpenURL('whatsapp://send');
    if (canOpenNative) {
      await Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`);
      return;
    }
  } catch (err) {
    console.warn('Native WhatsApp open failed:', err);
  }

  // Fallback to WhatsApp Web
  try {
    await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
    return;
  } catch (err) {
    console.warn('WhatsApp Web open failed:', err);
  }

  // If all fails, prompt options
  Alert.alert(
    'WhatsApp Not Available',
    'WhatsApp could not be opened. Choose an option:',
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
};

const openWhatsApp = async (phoneNumber, message = '') => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('254')
      ? cleanNumber
      : `254${cleanNumber.replace(/^0/, '')}`;
    const encodedMessage = encodeURIComponent(message);

    try {
      const canOpenNative = await Linking.canOpenURL('whatsapp://send');
      if (canOpenNative) {
        await Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`);
        return;
      }
    } catch (err) {
      console.warn('Native WhatsApp open failed:', err);
    }

    try {
      await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
      return;
    } catch (err) {
      console.warn('WhatsApp Web failed:', err);
    }

    Alert.alert(
      'WhatsApp Not Available',
      'WhatsApp could not be opened. Choose an option:',
      [
        {
          text: 'Copy Number',
          onPress: async () => {
            await Clipboard.setStringAsync(formattedNumber);
            Alert.alert('Copied!', `${formattedNumber} copied to clipboard`);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }; 
  const handleOrganizationPress = (organization) => {
    // Navigate to specific organization detail screen
    navigation.navigate('OrganizationDetail', { 
      organization,
      organizationId: organization._id 
    });
  };

  const renderMeetingInfo = (organization) => {
    const { weeklyMeetingDay, meetingTime, meetingLocation } = organization;
    
    if (!weeklyMeetingDay || weeklyMeetingDay === 'N/A' || weeklyMeetingDay === 'Undisclosed') {
      return null;
    }

    return (
      <View style={styles.meetingInfoContainer}>
        <Text style={styles.meetingInfoTitle}>Meeting Info:</Text>
        <Text style={styles.meetingInfoText}>
          {weeklyMeetingDay} at {meetingTime} • {meetingLocation}
        </Text>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading organizations...</Text>
      </View>
    );
  }

  // Error state with retry option
  if (error && organizations.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Unable to load organizations</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrganizations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCategoryTabs()}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.organizationsContainer}>
          {filteredOrganizations.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No organizations found in this category
              </Text>
            </View>
          ) : (
            filteredOrganizations.map((org) => (
              <TouchableOpacity
                key={org._id}
                style={[styles.organizationCard, { backgroundColor: org.color }]}
                onPress={() => handleOrganizationPress(org)}
              >
                <View style={styles.orgHeader}>
                  <Text style={styles.orgIcon}>{org.icon}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{org.category}</Text>
                  </View>
                </View>
                
                <Text style={styles.orgName}>{org.name}</Text>
                <Text style={styles.orgDescription}>{org.description}</Text>
                
                <View style={styles.servicesContainer}>
                  <Text style={styles.servicesTitle}>Services:</Text>
                  <View style={styles.servicesList}>
                    {org.services?.map((service, serviceIndex) => (
                      <View key={serviceIndex} style={styles.serviceTag}>
                        <Text style={styles.serviceText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                {renderMeetingInfo(org)}
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.whatsappButton}
                    onPress={() => handleWhatsAppMessage(org)}
                  >
                    <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

         {/* Join Section */}
      <View style={styles.joinSection}>
        <Text style={styles.joinTitle}>Want to add your organization?</Text>
        <Text style={styles.joinText}>
          Contact the admin to get your organization featured here
        </Text>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => openWhatsApp(contactAdminNumber, defaultMessage)}
        >
          <Text style={styles.joinButtonText}>Contact Admin</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
};

// Additional styles for new components
const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
    paddingTop: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#C7D2FE',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeCategoryTab: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  organizationsContainer: {
    padding: 16,
  },
  organizationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orgIcon: {
    fontSize: 32,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
  },
  orgName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  orgDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  servicesContainer: {
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 12,
    color: '#475569',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  whatsappButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  joinText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  meetingInfoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  meetingInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  meetingInfoText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default OrganizationScreen;  