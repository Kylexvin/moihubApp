// screens/eshop/EshopHomeScreen.js
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
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const EshopHomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://moihub.onrender.com/api/eshop/vendor/categories');
      const data = await response.json();
        
      if (data.success) {
        setCategories(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryShops', {
      categorySlug: category.slug,
      categoryName: category.name,
      categoryId: category._id,
    });
  };

  const handleWhatsAppPress = () => {
    const phoneNumber = '+254768610613';        
    const message = 'Hi! I need help with the E-Shop in Moihub app.';
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl)
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'Unable to open WhatsApp. Please make sure it is installed.');
      });
  };

  const handleMyOrdersPress = () => {
    navigation.navigate('Orders');
  };

  const handleOnboardingPress = () => {
    navigation.navigate('OnboardingNavigator');
  };

  const getIconName = (categoryName) => {
    const name = categoryName.toLowerCase();
    
    // Check for specific keywords in category names
    if (name.includes('boutique') || name.includes('fashion') || name.includes('clothing') || name.includes('apparel')) {
      return 'checkroom';
    }
    if (name.includes('gift') || name.includes('accessories') || name.includes('jewelry')) {
      return 'card-giftcard';
    }
    if (name.includes('food') || name.includes('restaurant') || name.includes('cafe') || name.includes('kitchen')) {
      return 'restaurant';
    }
    if (name.includes('electronics') || name.includes('gadgets') || name.includes('tech') || name.includes('devices')) {
      return 'devices';
    }
    if (name.includes('home') || name.includes('furniture') || name.includes('decor')) {
      return 'home';
    }
    if (name.includes('pharmacy') || name.includes('medical') || name.includes('health') || name.includes('medicine')) {
      return 'local-pharmacy';
    }
    if (name.includes('mali') || name.includes('general') || name.includes('variety') || name.includes('convenience')) {
      return 'store';
    }
    if (name.includes('beauty') || name.includes('cosmetics') || name.includes('salon')) {
      return 'face';
    }
    if (name.includes('sports') || name.includes('fitness') || name.includes('gym')) {
      return 'fitness-center';
    }
    if (name.includes('books') || name.includes('stationery') || name.includes('education')) {
      return 'menu-book';
    }
    if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) {
      return 'directions-car';
    }
    if (name.includes('pet') || name.includes('animal')) {
      return 'pets';
    }
    if (name.includes('toy') || name.includes('kids') || name.includes('children')) {
      return 'toys';
    }
    if (name.includes('flower') || name.includes('garden') || name.includes('plant')) {
      return 'local-florist';
    }
    if (name.includes('shoe') || name.includes('footwear')) {
      return 'shopping-bag';
    }
    
    // Default fallback icon
    return 'storefront';
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Icon name="receipt-long" size={24} color="#059669" />
          <Text style={styles.quickActionText}>My Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="shopping-cart" size={24} color="#059669" />
          <Text style={styles.quickActionText}>Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={handleWhatsAppPress}
        >
          <Icon name="chat" size={24} color="#059669" />
          <Text style={styles.quickActionText}>Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: getCategoryColor(index) }]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.categoryIconContainer}>
        <Icon
          name={getIconName(item.name)}
          size={32}
          color="#fff"
        />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.categoryFooter}>
       
      </View>
    </TouchableOpacity>
  );

  const getCategoryColor = (index) => {
    const emeraldColors = [
      '#059669', // Emerald 600
      '#047857', // Emerald 700
      '#065f46', // Emerald 800
      '#10b981', // Emerald 500
      '#34d399', // Emerald 400
      '#6ee7b7', // Emerald 300
      '#0d9488', // Teal 600
      '#0f766e', // Teal 700
      '#059669', // Emerald 600
      '#047857', // Emerald 700
      '#065f46', // Emerald 800
      '#10b981', // Emerald 500
      '#34d399', // Emerald 400
      '#6ee7b7', // Emerald 300
      '#0d9488', // Teal 600
      '#0f766e', // Teal 700
    ];
    return emeraldColors[index % emeraldColors.length];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading your shopping experience...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ScrollView
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#059669']}
            tintColor="#059669"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover Amazing Deals</Text>
        </View>

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          {categories.length > 0 ? (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item._id}
              numColumns={2}
              contentContainerStyle={styles.categoriesContainer}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="storefront" size={60} color="#9ca3af" />
              <Text style={styles.emptyText}>No categories available</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Want Your Shop Here Section */}
        <View style={styles.shopHereSection}>
          <TouchableOpacity 
            style={styles.shopHereCard}
            onPress={handleOnboardingPress}
            activeOpacity={0.8}
          >
            <Icon name="store" size={40} color="#059669" />
            <View style={styles.shopHereContent}>
              <Text style={styles.shopHereTitle}>Want Your Shop Here?</Text>
              <Text style={styles.shopHereSubtitle}>
                Join our marketplace and start selling to thousands of customers
              </Text>
            </View>
            <Icon name="arrow-forward" size={20} color="#059669" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Floating My Orders Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleMyOrdersPress}
        activeOpacity={0.8}
      >
        <Icon name="receipt-long" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ivory',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D1D5DB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#02604c',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    alignSelf: 'center',
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    fontWeight: '500',
  },
  categoriesSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  categoriesContainer: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  shopHereSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 100,
  },
  shopHereCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shopHereContent: {
    flex: 1,
    marginLeft: 16,
  },
  shopHereTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  shopHereSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#059669',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});

export default EshopHomeScreen;