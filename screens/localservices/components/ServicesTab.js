// screens/localservices/components/ServicesTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import Theme from '../../theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;

const ServicesTab = ({ 
  providerId, 
  providerName, 
  token, 
  navigation,
  onInitiateChat 
}) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/services`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000
        }
      );
      
      const transformedServices = response.data.services?.map(service => ({
        id: service._id || service.id,
        name: service.name,
        duration: `${service.duration} mins`,
        price: `KES ${service.price?.toLocaleString?.() || service.price}`,
        description: service.description,
        category: service.category || 'Service',
        image: service.image
      })) || [];
      
      setServices(transformedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [providerId, token]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchServices();
  };

  const handleBookService = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to booking screen
    navigation.navigate('Booking', {
      serviceId: service.id,
      providerId,
      providerName,
    });
  };

  const handleQuickBook = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const bookingDetails = {
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.duration,
    };
    
    onInitiateChat(bookingDetails);
  };

  // Skeleton Loading Component
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonDescription} />
            <View style={styles.skeletonFooter}>
              <View style={styles.skeletonPrice} />
              <View style={styles.skeletonButton} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return renderSkeleton();
  }

  if (error && !loading) {
    return (
      <View style={styles.errorContainer}>
        <ScrollView
          contentContainerStyle={styles.errorScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        <View style={styles.tabContent}>
          <View style={styles.servicesHeader}>
            <View>
              <Text style={styles.tabTitle}>Services</Text>
              <Text style={styles.tabSubtitle}>
                {services.length} service{services.length !== 1 ? 's' : ''} available
              </Text>
            </View>
          </View>
          
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No services available</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for updates</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  {/* Service Image */}
                  <View style={styles.serviceImageContainer}>
                    {service.image ? (
                      <Image 
                        source={{ uri: service.image }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.serviceImagePlaceholder}>
                        <Ionicons name="construct" size={24} color={Colors.textSecondary} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {service.name}
                    </Text>
                    
                    {service.description ? (
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    ) : null}
                    
                    <View style={styles.serviceMeta}>
                      <View style={styles.serviceDuration}>
                        <Ionicons name="time" size={14} color={Colors.textSecondary} />
                        <Text style={styles.serviceDurationText}>{service.duration}</Text>
                      </View>
                      
                      <View style={styles.serviceCategory}>
                        <Ionicons name="pricetag" size={14} color={Colors.textSecondary} />
                        <Text style={styles.serviceCategoryText}>{service.category}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.serviceFooter}>
                      <Text style={styles.servicePrice}>{service.price}</Text>
                      
                      <View style={styles.serviceActions}>
                        <TouchableOpacity 
                          style={styles.bookButton}
                          onPress={() => handleBookService(service)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="calendar" size={16} color={Colors.text} />
                          <Text style={styles.bookButtonText}>Book</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.chatButton}
                          onPress={() => handleQuickBook(service)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="chatbubble" size={16} color={Colors.text} />
                          <Text style={styles.chatButtonText}>Quick Chat</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {services.length > 0 && (
            <View style={styles.bookingNote}>
              <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.bookingNoteText}>
                Book services directly or chat with provider for inquiries
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    minHeight: 400,
  },
  scrollView: {
    flex: 1,
  },
  // Skeleton Styles
  skeletonContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  skeletonImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  skeletonContent: {
    gap: Spacing.sm,
  },
  skeletonTitle: {
    width: '70%',
    height: 20,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.sm,
  },
  skeletonDescription: {
    width: '90%',
    height: 16,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.sm,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  skeletonPrice: {
    width: 80,
    height: 20,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.sm,
  },
  skeletonButton: {
    width: 100,
    height: 36,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.md,
  },
  // Error Styles
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: 300,
  },
  errorText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  // UI Styles (same as your original ServicesTab would have)
  tabContent: {
    padding: Spacing.lg,
  },
  servicesHeader: {
    marginBottom: Spacing.lg,
  },
  tabTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tabSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  servicesList: {
    gap: Spacing.md,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  serviceImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    backgroundColor: Colors.card + '80',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card + '40',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontSize: 16,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceDurationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceCategoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  bookButtonText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  chatButtonText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  bookingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  bookingNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default ServicesTab;