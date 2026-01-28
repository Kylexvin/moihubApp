// screens/localservices/components/ProductsTab.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, BorderRadius } = Theme;

const ProductsTab = ({ productsData, addToCart, cart, overviewData }) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.productsHeader}>
        <View>
          <Text style={styles.tabTitle}>Products</Text>
          <Text style={styles.tabSubtitle}>Shop our premium products</Text>
        </View>
        {cart.length > 0 && (
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to cart screen
            }}
          >
            <Ionicons name="cart" size={20} color={Colors.text} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      
      {productsData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyStateText}>No products available</Text>
          <Text style={styles.emptyStateSubtext}>Check back later for updates</Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {productsData.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productEmojiContainer}>
                <Ionicons name="cube" size={20} color={Colors.primary} />
              </View>
              
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
                
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  <View style={styles.stockStatus}>
                    <View style={[
                      styles.stockDot, 
                      { backgroundColor: product.inStock ? Colors.success : Colors.danger }
                    ]} />
                    <Text style={[
                      styles.stockText,
                      { color: product.inStock ? Colors.success : Colors.danger }
                    ]}>
                      {product.inStock ? `In Stock (${product.stockCount})` : 'Out of Stock'}
                    </Text>
                  </View>
                </View>
                
                {product.inStock && (
                  <TouchableOpacity 
                    style={styles.addToCartButton}
                    onPress={() => addToCart(product)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle" size={18} color={Colors.primary} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      
      {productsData.length > 0 && (
        <View style={styles.shoppingNote}>
          <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
          <Text style={styles.shoppingNoteText}>
            You can add products to your cart and purchase them during booking
          </Text>
        </View>
      )}
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
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  cartButton: {
    position: 'relative',
    padding: Spacing.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '700',
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  productCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  productEmojiContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productPrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  addToCartText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  shoppingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  shoppingNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default ProductsTab;