// screens/ai/components/EshopProductCard.js
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
};

const EshopProductCard = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.eshopProducts || data.eshopProducts.length === 0) {
    return null;
  }

  const product = data.eshopProducts[0];
  const shop = product.shop;

const handleShopPress = () => {
  const shopData = {
    ...shop,
    slug: shop.slug || shop.shopName?.toLowerCase().replace(/\s+/g, '-')
  };
  onViewDetails?.(shopData, 'eshop');
};

  const handleProductPress = () => {
    onViewDetails?.(product, 'product');
  };

  const handleWhatsApp = () => {
    if (onCall && shop?.phoneNumber) {
      onCall(shop.phoneNumber);
    }
  };

  return (
    <View style={styles.container}>
      {/* Product Image */}
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="cube-outline" size={40} color="#ccc" />
        </View>
      )}

      {/* Product Info */}
      <View style={styles.content}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.productPrice}>KSh {product.price}</Text>

        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}

        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        {/* Shop Info */}
        {shop && (
          <TouchableOpacity style={styles.shopInfoRow} onPress={handleShopPress}>
            <Ionicons name="storefront-outline" size={14} color={C.textMeta} />
            <Text style={styles.shopNameText} numberOfLines={1}>
              {shop.shopName}
            </Text>
            {shop.isOpen && <View style={styles.openDot} />}
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shopButton} onPress={handleShopPress}>
            <Ionicons name="storefront-outline" size={16} color={C.white} />
            <Text style={styles.shopButtonText}>View Shop</Text>
          </TouchableOpacity>

          {shop?.phoneNumber && (
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={styles.whatsappButtonText}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
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
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: C.bg,
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: C.accent,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: C.textMeta,
  },
  description: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 8,
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    paddingVertical: 4,
  },
  shopNameText: {
    fontSize: 13,
    color: C.textSecondary,
    flex: 1,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
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

export default React.memo(EshopProductCard);