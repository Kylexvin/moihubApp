// screens/ai/components/ServiceCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const C = {
  accent: '#059669',
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMeta: '#888888',
  border: '#e0e0e0',
  surface: '#ffffff',
  bg: '#f5f5f5',
  white: '#ffffff',
  gold: '#D4AF37',
  success: '#4CAF50',
  danger: '#f44336',
  warning: '#FF9800',
};

const ServiceCard = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.providers || data.providers.length === 0) {
    return null;
  }

  const provider = data.providers[0];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`star-${i}`} name="star" size={14} color={C.gold} />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half-star" name="star-half" size={14} color={C.gold} />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color={C.textMeta} />);
    }
    return stars;
  };

  const handleCall = () => {
    if (onCall && provider.phone) {
      onCall(provider.phone);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={C.white} />
          </View>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {provider.name}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{provider.category}</Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color={C.textMeta} />
          <Text style={styles.detailText} numberOfLines={1}>
            {provider.areasOfOperation?.join(', ') || 'Location not specified'}
          </Text>
        </View>
        
        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {renderStars(provider.rating || 0)}
          </View>
          <Text style={styles.ratingText}>
            {provider.rating?.toFixed(1) || '0'} ({provider.totalReviews || 0} reviews)
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onViewDetails?.(provider)}
        >
          <Ionicons name="eye-outline" size={16} color={C.white} />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
        >
          <Ionicons name="call-outline" size={16} color={C.accent} />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>

        {provider.hasDashboard && (
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => onViewDetails?.(provider, 'dashboard')}
          >
            <Ionicons name="business-outline" size={16} color={C.white} />
            <Text style={styles.dashboardButtonText}>Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: C.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textPrimary,
  },
  categoryBadge: {
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  categoryText: {
    fontSize: 11,
    color: C.textSecondary,
  },
  details: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 12,
    color: C.textMeta,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  viewButtonText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 13,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
  },
  callButtonText: {
    color: C.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  dashboardButtonText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default ServiceCard;