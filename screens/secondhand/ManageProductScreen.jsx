import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Dark Warm Amber Theme (matching MarketplaceDashboard)
const MarketplaceColors = {
  primary: '#03604d',      
  primaryDark: '#0e582a',   // Dark Amber
  primaryLight: '#0b7a0b',  // Light Amber
  secondary: '#10B981',     // Teal (for success/balance)
  accent: '#8B5CF6',        // Purple (for highlights)
  background: '#0F0F0F',    // Near Black
  surface: '#1A1A1A',       // Dark Surface
  card: '#242424',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#9CA3AF', // Gray
  textMuted: '#6B7280',     // Dark Gray
  border: '#2D2D2D',        // Border
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const ManageProductScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('api/marketplace/seller');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Fetch products error:', err);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('api/marketplace/seller');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Refresh error:', err);
      Alert.alert('Error', 'Failed to refresh products');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`api/marketplace/delete/${id}`);
              setProducts((prev) => prev.filter((p) => p._id !== id));
              Alert.alert('Success', 'Product deleted successfully');
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSold = async (id) => {
    Alert.alert(
      'Mark as Sold',
      'This will mark the product as sold and remove it from listings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await axios.put(`api/marketplace/sold/${id}`);
              setProducts((prev) => prev.filter((p) => p._id !== id));
              Alert.alert('Success', 'Product marked as sold');
            } catch (err) {
              console.error('Mark as sold error:', err);
              Alert.alert('Error', 'Failed to mark as sold');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return MarketplaceColors.success;
      case 'pending':
        return MarketplaceColors.warning;
      case 'rejected':
        return MarketplaceColors.error;
      default:
        return MarketplaceColors.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <LinearGradient
        colors={[MarketplaceColors.card, MarketplaceColors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.productHeader}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.productImage} 
            defaultSource={require('../../assets/hero.jpg')} 
          />
          
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            
            <View style={styles.statusContainer}>
              <Ionicons 
                name={getStatusIcon(item.approvalStatus)} 
                size={14} 
                color={getStatusColor(item.approvalStatus)} 
              />
              <Text style={[styles.status, { color: getStatusColor(item.approvalStatus) }]}>
                {item.approvalStatus?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>

            <Text style={styles.price}>Ksh {item.price?.toLocaleString() || '0'}</Text>
            
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {/* Edit Button (commented out in original) */}
          {/* <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditProduct', { product: item })}
          >
            <Ionicons name="pencil" size={14} color={MarketplaceColors.info} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity> */}

          <TouchableOpacity 
            style={[styles.actionButton, styles.soldButton]}
            onPress={() => handleMarkAsSold(item._id)}
          >
            <Ionicons name="checkmark-circle" size={14} color={MarketplaceColors.success} />
            <Text style={styles.soldText}>Mark Sold</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash" size={14} color={MarketplaceColors.error} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="storefront-outline" size={60} color={MarketplaceColors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Products Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start selling by adding your first product
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateProduct')}
      >
        <LinearGradient
          colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
          style={styles.emptyButtonGradient}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Add Your First Product</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[MarketplaceColors.background, MarketplaceColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="pricetags" size={40} color={MarketplaceColors.primary} />
          </View>
          <ActivityIndicator size="large" color={MarketplaceColors.primary} />
          <Text style={styles.loadingText}>Loading your products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Products</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[
          styles.listContainer,
          products.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={MarketplaceColors.primary}
            colors={[MarketplaceColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {products.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateProduct')}
        >
          <LinearGradient
            colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketplaceColors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MarketplaceColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: MarketplaceColors.textSecondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  cardGradient: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: MarketplaceColors.surface,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MarketplaceColors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MarketplaceColors.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: MarketplaceColors.textSecondary,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: MarketplaceColors.border,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: MarketplaceColors.info + '10',
    borderColor: MarketplaceColors.info + '30',
  },
  soldButton: {
    backgroundColor: MarketplaceColors.success + '10',
    borderColor: MarketplaceColors.success + '30',
  },
  deleteButton: {
    backgroundColor: MarketplaceColors.error + '10',
    borderColor: MarketplaceColors.error + '30',
  },
  editText: {
    color: MarketplaceColors.info,
    fontWeight: '600',
    fontSize: 12,
  },
  soldText: {
    color: MarketplaceColors.success,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteText: {
    color: MarketplaceColors.error,
    fontWeight: '600',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: MarketplaceColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MarketplaceColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: MarketplaceColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: MarketplaceColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ManageProductScreen;