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
  FlatList,
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

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      {item.imageURL ? (
        <Image source={{ uri: item.imageURL }} style={styles.menuImage} />
      ) : item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
      ) : (
        <View style={styles.menuImagePlaceholder}>
          <Ionicons name="fast-food-outline" size={24} color={COLORS.textMeta} />
        </View>
      )}
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.menuItemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Text style={styles.menuItemPrice}>KSh {item.price}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Left: Vendor Info ─────────────────────────────────────────── */}
        <View style={styles.vendorSection}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.iconContainer}>
                <Ionicons name="restaurant" size={28} color={COLORS.white} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.shopName} numberOfLines={1}>{vendor.shopName}</Text>
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
              <Text style={styles.descriptionText} numberOfLines={2}>
                {vendor.description}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Right: Menu Items (Horizontal Scroll) ────────────────────── */}
        <View style={styles.menuSection}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>📋 Menu</Text>
            <Text style={styles.menuCount}>{menuItems.length} items</Text>
          </View>

          {hasMenu ? (
            <FlatList
              data={menuItems}
              keyExtractor={(item) => item.id?.toString() || item.name}
              renderItem={renderMenuItem}
              scrollEnabled={false}
              contentContainerStyle={styles.menuList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyMenu}>
              <Ionicons name="fast-food-outline" size={32} color={COLORS.textMeta} />
              <Text style={styles.emptyMenuText}>No menu items</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: width * 0.85,
  },
  scrollContainer: {
    maxHeight: 360,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  vendorSection: {
    width: width * 0.35,
    flexShrink: 0,
  },
  header: {
    marginBottom: 8,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerInfo: {
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMeta,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  callButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.accent,
  },
  descriptionSection: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  menuSection: {
    flex: 1,
    minWidth: width * 0.42,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuCount: {
    fontSize: 11,
    color: COLORS.textMeta,
  },
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    padding: 6,
    gap: 8,
  },
  menuImage: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: COLORS.bg,
  },
  menuImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  menuItemDescription: {
    fontSize: 10,
    color: COLORS.textMeta,
  },
  menuItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  emptyMenuText: {
    fontSize: 12,
    color: COLORS.textMeta,
  },
});

export default FoodDetailCard;