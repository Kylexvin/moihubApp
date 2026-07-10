// screens/ai/components/FoodDetailCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
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

const FoodDetailCard = ({ data, onViewDetails, onCall }) => {
  if (!data) return null;

  const vendor = data;
  const menuItems = vendor.menu || [];
  const hasMenu = menuItems.length > 0;
  const displayItems = menuItems.slice(0, 5);
  const hasMoreItems = menuItems.length > 5;

  const getStatusColor = () => {
    if (vendor.isOpen === true) return COLORS.success;
    if (vendor.isOpen === false) return COLORS.danger;
    return COLORS.warning;
  };

  const getStatusText = () => {
    if (vendor.isOpen === true) return 'Open Now';
    if (vendor.isOpen === false) return 'Closed';
    return 'Unknown';
  };

  const handleCall = () => {
    if (onCall && vendor.phone) {
      onCall(vendor.phone);
    }
  };

  const handleViewShop = () => {
    if (onViewDetails) {
      onViewDetails(vendor, 'food');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={28} color={COLORS.white} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.shopName}>{vendor.shopName}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textMeta} />
              <Text style={styles.locationText}>{vendor.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          {vendor.phone && (
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Ionicons name="call-outline" size={16} color={COLORS.accent} />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Description */}
      {vendor.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>{vendor.description}</Text>
        </View>
      )}

      {/* Menu */}
      <View style={styles.menuSection}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>📋 Menu</Text>
          <Text style={styles.menuCount}>{menuItems.length} items</Text>
        </View>

        {hasMenu ? (
          <>
            {displayItems.map((item, index) => (
              <View key={index} style={styles.menuItem}>
                {(item.imageURL || item.imageUrl) && (
                  <Image 
                    source={{ uri: item.imageURL || item.imageUrl }} 
                    style={styles.menuImage} 
                  />
                )}
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.menuItemDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.menuItemPrice}>KSh {item.price}</Text>
              </View>
            ))}

            {/* View Full Menu Button */}
            {hasMoreItems && (
              <TouchableOpacity style={styles.viewShopButton} onPress={handleViewShop}>
                <Ionicons name="eye-outline" size={16} color={COLORS.white} />
                <Text style={styles.viewShopText}>View Full Menu ({menuItems.length - 5} more)</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyMenu}>
            <Ionicons name="fast-food-outline" size={40} color={COLORS.textMeta} />
            <Text style={styles.emptyMenuText}>No menu items available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,    
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMeta,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.accent,
  },
  descriptionSection: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  menuSection: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuCount: {
    fontSize: 12,
    color: COLORS.textMeta,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    gap: 10,
  },
  menuImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: COLORS.bg,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  menuItemDescription: {
    fontSize: 11,
    color: COLORS.textMeta,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyMenuText: {
    fontSize: 14,
    color: COLORS.textMeta,
  },
  viewShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  viewShopText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default React.memo(FoodDetailCard);
