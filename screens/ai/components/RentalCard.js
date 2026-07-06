// screens/ai/components/RentalCard.js
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
  success: '#4CAF50',
  danger: '#f44336',
  warning: '#FF9800',
};

const RentalCard = ({ data, onViewDetails }) => {
  if (!data || !data.rentals || data.rentals.length === 0) {
    return null;
  }

  const rental = data.rentals[0];

  const getStatusColor = () => {
    if (rental.hasVacant === true) return C.success;
    if (rental.hasVacant === false) return C.danger;
    return C.warning;
  };

  const getStatusText = () => {
    if (rental.hasVacant === true) return 'Available';
    if (rental.hasVacant === false) return 'Occupied';
    return 'Unknown';
  };

  return (
    <View style={styles.container}>
      {/* Landscape Image - using aspectRatio like RentalDetail */}
      {rental.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: rental.imageUrl }} 
            style={styles.rentalImage}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="images-outline" size={40} color="#ccc" />
        </View>
      )}

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {rental.name}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={C.textMeta} />
            <Text style={styles.detailText}>{rental.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="bed-outline" size={14} color={C.textMeta} />
            <Text style={styles.detailText}>{rental.type}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={14} color={C.textMeta} />
            <Text style={styles.detailText}>KSh {rental.price}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onViewDetails?.(rental)}
        >
          <Ionicons name="eye-outline" size={16} color={C.white} />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
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
    borderColor: C.accent,
    borderWidth: 2,
    overflow: 'hidden',
  },
  // ─── Image - Using aspectRatio like RentalDetail ──────────────────────────
  imageContainer: {
    width: '100%',
    aspectRatio: 3.75, // 750:200 = 3.75 (landscape)
    backgroundColor: C.bg,

  },
  rentalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 3.75,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.white,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textPrimary,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  details: {
    marginBottom: 10,
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: C.textSecondary,
    textTransform: 'capitalize',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default RentalCard;