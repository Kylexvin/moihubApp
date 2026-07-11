// screens/ai/components/FoodCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  primary: '#FF6B35',
  secondary: '#F7C35C',
  accent: '#EF476F',
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

const FoodCard = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.foodVendors || data.foodVendors.length === 0) {
    return null;
  }

  const vendor = data.foodVendors[0];

  const getStatusColor = () => {
    if (vendor.isOpen === true) return C.success;
    if (vendor.isOpen === false) return C.danger;
    return C.warning;
  };

  const getStatusText = () => {
    if (vendor.isOpen === true) return 'Open';
    if (vendor.isOpen === false) return 'Closed';
    return 'Unknown';
  };

  const handleCall = () => {
    if (onCall && vendor.phone) {
      onCall(vendor.phone);
    }
  };

  const matchedItems = vendor.matchedItems || [];
  const relatedItems = vendor.relatedItems || [];
  const hasMatched = matchedItems.length > 0;
  const hasRelated = relatedItems.length > 0;

  return (
    <View style={styles.container}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="restaurant" size={22} color={C.white} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {vendor.shopName}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={C.textMeta} />
            <Text style={styles.locationText}>{vendor.location}</Text>
          </View>
        </View>
      </View>

      {/* Matched Items */}
      {hasMatched && (
        <View style={styles.matchedSection}>
          <Text style={styles.sectionLabel}>🔍 Matched</Text>
          {matchedItems.map((item, index) => (
            <View key={index} style={styles.matchedItem}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>KSh {item.price}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Related Items */}
      {hasRelated && (
        <View style={styles.relatedSection}>
          <Text style={styles.sectionLabel}>🍽️ Also Available</Text>
          {relatedItems.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.relatedItem}>
              <Text style={styles.relatedItemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.relatedItemPrice}>KSh {item.price}</Text>
            </View>
          ))}
          {relatedItems.length > 3 && (
            <Text style={styles.moreText}>+{relatedItems.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onViewDetails?.(vendor)}
        >
          <Ionicons name="eye-outline" size={16} color={C.white} />
          <Text style={styles.viewButtonText}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
        >
          <Ionicons name="call-outline" size={16} color={C.primary} />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: C.border,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.white,
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  locationText: {
    fontSize: 12,
    color: C.textMeta,
  },
  matchedSection: {
    backgroundColor: '#fef6f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fde8d8',
  },
  relatedSection: {
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMeta,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  matchedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  itemImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.bg,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textPrimary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },
  relatedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  relatedItemName: {
    fontSize: 13,
    color: C.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  relatedItemPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: C.primary,
  },
  moreText: {
    fontSize: 11,
    color: C.textMeta,
    marginTop: 2,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
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
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
  },
  callButtonText: {
    color: C.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default React.memo(FoodCard);