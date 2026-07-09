// screens/ai/components/EshopCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
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
};

const EshopCard = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.eshops || data.eshops.length === 0) {
    return null;
  }

  const shop = data.eshops[0];
  const products = shop.products || [];
  const displayProducts = products.slice(0, 5);
  const hasMoreProducts = products.length > 5;
  const hasProducts = products.length > 0;

const handleShopPress = () => {
  onViewDetails?.(shop, 'eshop');
};


  const handleWhatsApp = () => {
    if (onCall && shop.phoneNumber) {
      onCall(shop.phoneNumber);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {shop.logo && shop.logo !== 'default-shop.png' ? (
          <Image source={{ uri: shop.logo }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="storefront" size={30} color={C.white} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shop.shopName}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{shop.category || 'General'}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: shop.isOpen ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.statusText}>{shop.isOpen ? 'Open' : 'Closed'}</Text>
            <Text style={styles.productCount}> • {shop.productCount || 0} products</Text>
            {shop.hasSubscription && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={C.accent} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Products Preview */}
      {hasProducts ? (
        <View style={styles.productsSection}>
          <Text style={styles.productsLabel}>🛍️ Products</Text>
          <FlatList
            data={displayProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id?.toString() || item.name}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productItem} onPress={() => onViewDetails?.(item, 'product')}>
                {item.image && item.image !== 'default-product.png' ? (
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="cube-outline" size={20} color="#ccc" />
                  </View>
                )}
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>KSh {item.price}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              hasMoreProducts ? (
                <TouchableOpacity style={styles.viewMoreProducts} onPress={handleShopPress}>
                  <Text style={styles.viewMoreText}>+{products.length - 5} more</Text>
                  <Ionicons name="arrow-forward" size={14} color={C.accent} />
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      ) : (
        <View style={styles.noProductsContainer}>
          <Ionicons name="cube-outline" size={24} color="#ccc" />
          <Text style={styles.noProductsText}>No products yet</Text>
        </View>
      )}

      {/* Description */}
      {shop.description && (
        <Text style={styles.description} numberOfLines={2}>
          {shop.description}
        </Text>
      )}

      {/* Location */}
      {shop.address && shop.address !== 'Online' && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={C.textMeta} />
          <Text style={styles.locationText} numberOfLines={1}>{shop.address}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.shopButton} onPress={handleShopPress}>
          <Ionicons name="storefront-outline" size={16} color={C.white} />
          <Text style={styles.shopButtonText}>View Shop</Text>
        </TouchableOpacity>

        {shop.phoneNumber && (
          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text style={styles.whatsappButtonText}>Chat</Text>
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
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.bg,
    marginRight: 10,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textPrimary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 11,
    color: C.textMeta,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: C.textMeta,
  },
  productCount: {
    fontSize: 12,
    color: C.textMeta,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    color: C.accent,
    fontWeight: '500',
  },
  productsSection: {
    marginBottom: 8,
  },
  productsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMeta,
    marginBottom: 6,
  },
  productItem: {
    width: 80,
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 6,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: C.bg,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: C.accent,
  },
  viewMoreProducts: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  viewMoreText: {
    fontSize: 11,
    color: C.accent,
    fontWeight: '500',
  },
  noProductsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  noProductsText: {
    fontSize: 13,
    color: C.textMeta,
  },
  description: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: C.textMeta,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 2,
  },
  shopButtonText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 13,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  whatsappButtonText: {
    color: C.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default EshopCard;