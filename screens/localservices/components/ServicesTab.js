// screens/localservices/components/ServicesTab.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius } = Theme;

const ServicesTab = ({ 
  servicesData, 
  onBookService,
  loading = false 
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading services...</Text>
      </View>
    );
  }

  if (servicesData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="construct" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyStateText}>No services available</Text>
        <Text style={styles.emptyStateSubtext}>Check back later for updates</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Available Services</Text>
      <Text style={styles.tabSubtitle}>Choose from our professional treatments</Text>
      
      {servicesData.map((service) => (
        <View key={service.id} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceEmojiContainer}>
              <Ionicons name="sparkles" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <View style={styles.serviceMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{service.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="money-bill-wave" size={12} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{service.price}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.bookServiceButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onBookService(service);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.bookServiceText}>Book This Service</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: Spacing.lg,
  },
  tabTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tabSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  serviceHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  serviceEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  serviceDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bookServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  bookServiceText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ServicesTab;