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
    const phoneNumber = '+1234567890'; // Replace with your WhatsApp number
    const message = 'Hi! I need help with the E-Shop app.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('WhatsApp not installed', 'Please install WhatsApp to contact support.');
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  const handleMyOrdersPress = () => {
    navigation.navigate('Orders');
  };

  const getIconName = (iconName) => {
    const iconMap = {
      'tshirt': 'checkroom',
      'gift': 'card-giftcard',
      'food': 'restaurant',
      'electronics': 'devices',
      'home': 'home',
    };
    
    return iconMap[iconName] || 'category';
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
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => Alert.alert('Coming Soon', 'Wishlist feature coming soon!')}
        >
          <Icon name="favorite-border" size={24} color="#059669" />
          <Text style={styles.quickActionText}>Wishlist</Text>
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
          name={getIconName(item.icon)}
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
          {/* <Text style={styles.welcomeText}>Welcome back! 👋</Text> */}
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

        {/* Need Help Section */}
        <View style={styles.helpSection}>
  <TouchableOpacity 
    style={styles.helpCard}
    onPress={handleWhatsAppPress}
    activeOpacity={0.8}
  >
    <Icon name="support-agent" size={40} color="#059669" />

    <View style={styles.helpContent}>
      <Text style={styles.helpTitle}>Need Help?</Text>
      <Text style={styles.helpSubtitle}>
        Chat with us on WhatsApp for instant support
      </Text>
    </View>
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
  welcomeText: {
    fontSize: 16,
    color: '#d1fae5',
    marginBottom: 4,
  },
  headerTitle: {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: 8,
  textAlign: 'center',
  alignSelf: 'center',
},

  headerSubtitle: {
    fontSize: 16,
    color: '#d1fae5',
    lineHeight: 22,
  },
  promoBanner: {
    backgroundColor: '#10b981',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,  textAlign: 'center',
  alignSelf: 'center',
  },
  promoSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
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
  shopText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginRight: 4,
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
  helpSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 100,
  },
  helpCard: {
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
  },
  helpContent: {
    flex: 1,
    marginLeft: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  helpSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  whatsappButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  whatsappText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
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