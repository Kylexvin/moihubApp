// screens/ai/components/FoodCard.js
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
  gold: '#D4AF37',
};

const FoodCard = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.foodVendors || data.foodVendors.length === 0) {
    return null;
  }

  const vendor = data.foodVendors[0];

  // ─── Status ──────────────────────────────────────────────────────
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

  // ─── Show matched items (what user searched for) ────────────────
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
          <Ionicons name="restaurant" size={24} color={C.white} />
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

      {/* Matched Items (what user searched for) */}
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
                {item.description && (
                  <Text style={styles.itemDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Related Items */}
      {hasRelated && (
        <View style={styles.relatedSection}>
          <Text style={styles.sectionLabel}>🍽️ Also Available</Text>
          {relatedItems.slice(0, 4).map((item, index) => (
            <View key={index} style={styles.relatedItem}>
              <Text style={styles.relatedItemName}>{item.name}</Text>
              <Text style={styles.relatedItemPrice}>KSh {item.price}</Text>
            </View>
          ))}
          {relatedItems.length > 4 && (
            <Text style={styles.moreText}>+{relatedItems.length - 4} more</Text>
          )}
        </View>
      )}

      {/* Description */}
      {vendor.description && (
        <Text style={styles.description} numberOfLines={2}>
          {vendor.description}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onViewDetails?.(vendor)}
        >
          <Ionicons name="eye-outline" size={16} color={C.white} />
          <Text style={styles.viewButtonText}>Full Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
        >
          <Ionicons name="call-outline" size={16} color={C.accent} />
          <Text style={styles.callButtonText}>Call</Text>
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
    padding: 12,
    position: 'relative',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: C.textMeta,
  },
  matchedSection: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  relatedSection: {
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMeta,
    marginBottom: 4,
  },
  matchedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: C.bg,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: C.accent,
  },
  itemDescription: {
    fontSize: 11,
    color: C.textMeta,
  },
  relatedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  relatedItemName: {
    fontSize: 13,
    color: C.textSecondary,
  },
  relatedItemPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: C.accent,
  },
  moreText: {
    fontSize: 11,
    color: C.textMeta,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 10,
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
});

export default FoodCard;