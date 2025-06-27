// screens/eshop/CategoryShopsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const CategoryShopsScreen = ({ navigation, route }) => {
  const { categorySlug, categoryName, categoryId } = route.params;
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://moihub.onrender.com/api/eshop/vendor/categories/${categorySlug}/shops`);
      const data = await response.json();
      
      if (data.success) {
        setShops(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShops();
    setRefreshing(false);
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopProducts', {
      shopSlug: shop.slug,
      shopName: shop.shopName,
      shopId: shop._id,
    });
  };

  const getShopStatus = (shop) => {
    if (!shop.isActive) return { text: 'Inactive', color: '#ef4444', icon: 'block' };
    if (!shop.isOpen) return { text: 'Closed', color: '#f59e0b', icon: 'schedule' };
    if (!shop.isApproved) return { text: 'Pending', color: '#6b7280', icon: 'hourglass-empty' };
    if (new Date(shop.subscriptionEndDate) < new Date()) {
      return { text: 'Expired', color: '#ef4444', icon: 'event-busy' };
    }
    return { text: 'Open Now', color: '#059669', icon: 'storefront' };
  };

  const getShopIcon = (index) => {
    const icons = [
      'store',
      'shopping-bag',
      'local-mall',
      'storefront',
      'shopping-basket',
      'business',
      'apartment',
      'domain',
    ];
    return icons[index % icons.length];
  };

  const getShopColor = (index) => {
    const emeraldColors = [
      '#059669', // Emerald 600
      '#047857', // Emerald 700
      '#065f46', // Emerald 800
      '#10b981', // Emerald 500
      '#34d399', // Emerald 400
      '#0d9488', // Teal 600
      '#0f766e', // Teal 700
      '#14b8a6', // Teal 500
    ];
    return emeraldColors[index % emeraldColors.length];
  };

  const renderShopItem = ({ item, index }) => {
    const status = getShopStatus(item);
    const isAvailable = item.isActive && item.isOpen && item.isApproved && 
                       new Date(item.subscriptionEndDate) > new Date();

    return (
      <TouchableOpacity
        style={[
          styles.shopCard,
          !isAvailable && styles.unavailableShop
        ]}
        onPress={() => isAvailable && handleShopPress(item)}
        activeOpacity={isAvailable ? 0.8 : 1}
      >
        <View style={styles.shopHeader}>
          {/* Shop Icon */}
          <View style={[styles.shopIconContainer, { backgroundColor: getShopColor(index) }]}>
            <Icon
              name={getShopIcon(index)}
              size={32}
              color="#fff"
            />
          </View>
          
          <View style={styles.shopInfo}>
            <View style={styles.shopTitleRow}>
              <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                <Icon name={status.icon} size={12} color="#fff" />
                <Text style={styles.statusText}>{status.text}</Text>
              </View>
            </View>
            
            <Text style={styles.shopDescription} numberOfLines={2}>
              {item.description || 'Quality products and excellent service'}
            </Text>
            
            <View style={styles.shopMeta}>
              <View style={styles.metaItem}>
                <Icon name="location-on" size={16} color="#059669" />
                <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
              </View>
              {item.phoneNumber && (
                <View style={styles.metaItem}>
                  <Icon name="phone" size={16} color="#059669" />
                  <Text style={styles.metaText}>{item.phoneNumber}</Text>
                </View>
              )}
              {item.rating && (
                <View style={styles.metaItem}>
                  <Icon name="star" size={16} color="#f59e0b" />
                  <Text style={styles.metaText}>{item.rating}★</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {isAvailable && (
          <View style={styles.shopFooter}>
            <Text style={styles.browseText}>Browse Products</Text>
            <Icon name="arrow-forward" size={20} color="#059669" />
          </View>
        )}

        {!isAvailable && (
          <View style={styles.unavailableFooter}>
            <Text style={styles.unavailableText}>Currently unavailable</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerInfo}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryIconContainer}>
          <Icon name="category" size={24} color="#059669" />
        </View>
        <View style={styles.categoryDetails}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.shopsCount}>
            {shops.length} shop{shops.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      </View>
      
      {shops.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-list" size={16} color="#059669" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="sort" size={16} color="#059669" />
            <Text style={styles.filterText}>Sort</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Finding shops in {categoryName}...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={shops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.shopsList}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="store" size={60} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No Shops Found</Text>
            <Text style={styles.emptyText}>
              No shops are currently available in the {categoryName} category.
            </Text>
            <Text style={styles.emptySubtext}>
              Check back later or try refreshing the page.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchShops}>
              <Icon name="refresh" size={16} color="#fff" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
     backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerInfo: {
    backgroundColor: '#064e3b',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIconContainer: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  shopsCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  shopsList: {
    paddingBottom: 20,
  },
  shopCard: {
    backgroundColor: '#064e3b',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unavailableShop: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shopIconContainer: {
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  shopDescription: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 12,
  },
  shopMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 6,
    flex: 1,
  },
  shopFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#fff',
  },
  browseText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  unavailableFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default CategoryShopsScreen;