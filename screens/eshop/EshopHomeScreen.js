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
  RefreshControl,
  StatusBar
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Royal Purple & Gold theme colors
const ShopColors = {
  primary: '#6B4EFF',      // Royal Purple
  secondary: '#9F7AEA',     // Lavender
  accent: '#FFD700',        // Gold
  success: '#4CAF50',       // Green
  warning: '#FF9800',       // Orange
  error: '#F44336',         // Red
  background: '#0A0A0F',    // Deep Dark
  surface: '#1A1A2E',       // Dark Purple
  card: '#26264D',          // Royal Card
  text: '#FFFFFF',          // White
  textSecondary: '#E0B0FF', // Light Purple
  textMuted: '#9F8BB3',     // Muted Purple
  border: '#3D3D6B',        // Purple Border
  gold: '#FFD700',          // Pure Gold
  goldLight: '#FFE55C',     // Light Gold
  purpleLight: '#8B6FF6',   // Light Purple
};

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
    
    return 'storefront';
  };

  const renderQuickActions = () => (
    <Animatable.View animation="fadeInUp" delay={200} duration={500}>
      <LinearGradient
        colors={[ShopColors.surface, ShopColors.card]}
        style={styles.quickActionsContainer}
      >
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Orders')}
          >
            <View style={styles.quickActionIcon}>
              <Icon name="receipt-long" size={24} color={ShopColors.gold} />
            </View>
            <Text style={styles.quickActionText}>My Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.quickActionIcon}>
              <Icon name="shopping-cart" size={24} color={ShopColors.gold} />
            </View>
            <Text style={styles.quickActionText}>Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleWhatsAppPress}
          >
            <View style={styles.quickActionIcon}>
              <Icon name="chat" size={24} color={ShopColors.gold} />
            </View>
            <Text style={styles.quickActionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  const renderCategoryItem = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={300 + (index * 100)}
      duration={500}
      style={styles.categoryCardWrapper}
    >
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[ShopColors.card, ShopColors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryGradient}
        >
          {/* Gold Accent Line */}
          <View style={styles.categoryGoldAccent} />
          
          {/* Decorative Pattern */}
          <View style={styles.categoryPattern}>
            <Text style={styles.patternIcon}>👑</Text>
            <Text style={styles.patternIcon}>✨</Text>
          </View>

          <View style={styles.categoryIconContainer}>
            <LinearGradient
              colors={[ShopColors.primary, ShopColors.secondary]}
              style={styles.iconGradient}
            >
              <Icon name={getIconName(item.name)} size={32} color={ShopColors.gold} />
            </LinearGradient>
          </View>
          
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {item.description || 'Explore our collection'}
          </Text>
          
          <View style={styles.categoryFooter}>
            <Text style={styles.shopNowText}>Shop Now</Text>
            <Icon name="arrow-forward" size={16} color={ShopColors.gold} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderQuickActionsRow = () => (
    <Animatable.View animation="fadeInUp" delay={400} duration={500}>
      <LinearGradient
        colors={[ShopColors.surface, ShopColors.card]}
        style={styles.quickActionsRowContainer}
      >
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => navigation.navigate('Orders')}
        >
          <LinearGradient
            colors={[ShopColors.primary + '20', ShopColors.secondary + '10']}
            style={styles.quickActionItemGradient}
          >
            <Icon name="receipt-long" size={28} color={ShopColors.gold} />
            <Text style={styles.quickActionItemText}>Orders</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => navigation.navigate('Cart')}
        >
          <LinearGradient
            colors={[ShopColors.primary + '20', ShopColors.secondary + '10']}
            style={styles.quickActionItemGradient}
          >
            <Icon name="shopping-cart" size={28} color={ShopColors.gold} />
            <Text style={styles.quickActionItemText}>Cart</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={handleWhatsAppPress}
        >
          <LinearGradient
            colors={[ShopColors.primary + '20', ShopColors.secondary + '10']}
            style={styles.quickActionItemGradient}
          >
            <Icon name="chat" size={28} color={ShopColors.gold} />
            <Text style={styles.quickActionItemText}>Support</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.quickActionItem}
  onPress={() => navigation.navigate('EshopAI')}
>
  <LinearGradient
    colors={[ShopColors.primary + '20', ShopColors.secondary + '10']}
    style={styles.quickActionItemGradient}
  >
    <Icon name="auto-awesome" size={28} color={ShopColors.gold} />
    <Text style={styles.quickActionItemText}>AI Search</Text>
  </LinearGradient>
</TouchableOpacity>
      </LinearGradient>
    </Animatable.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Icon name="storefront" size={60} color={ShopColors.gold} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={ShopColors.gold} />
          <Text style={styles.loadingText}>Loading your shopping experience...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
      
      {/* Floating Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[ShopColors.gold]}
              tintColor={ShopColors.gold}
            />
          }
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={800}>
            <LinearGradient
              colors={[ShopColors.primary, ShopColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <Icon name="storefront" size={32} color={ShopColors.gold} />
                <Text style={styles.headerTitle}>E-Shop</Text>
              </View>
              <Text style={styles.headerSubtitle}>Discover amazing deals from trusted vendors</Text>
              
              {/* Gold Glow Effect */}
              <View style={styles.headerGlow} />
            </LinearGradient>
          </Animatable.View>

          {/* Quick Actions Row */}
          {renderQuickActionsRow()}

          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <Icon name="arrow-forward" size={20} color={ShopColors.gold} />
            </View>
            
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
              <Animatable.View animation="fadeIn" duration={500} style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="storefront" size={60} color={ShopColors.textMuted} />
                </View>
                <Text style={styles.emptyText}>No categories available</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
                  <LinearGradient
                    colors={[ShopColors.primary, ShopColors.secondary]}
                    style={styles.retryGradient}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            )}
          </View>

          {/* Want Your Shop Here Section */}
          <Animatable.View animation="fadeInUp" delay={600} duration={500}>
            <View style={styles.shopHereSection}>
              <TouchableOpacity 
                style={styles.shopHereCard}
                onPress={handleOnboardingPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[ShopColors.card, ShopColors.surface]}
                  style={styles.shopHereGradient}
                >
                  {/* Gold Accent */}
                  <View style={styles.shopHereGoldAccent} />
                  
                  <View style={styles.shopHereIconContainer}>
                    <LinearGradient
                      colors={[ShopColors.primary, ShopColors.secondary]}
                      style={styles.shopHereIcon}
                    >
                      <Icon name="store" size={28} color={ShopColors.gold} />
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.shopHereContent}>
                    <Text style={styles.shopHereTitle}>Want Your Shop Here?</Text>
                    <Text style={styles.shopHereSubtitle}>
                      Join our marketplace and start selling to thousands of customers
                    </Text>
                  </View>
                  
                  <View style={styles.shopHereArrow}>
                    <Icon name="arrow-forward" size={20} color={ShopColors.gold} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Floating My Orders Button */}
        <Animatable.View 
          animation="bounceIn"
          duration={1000}
          delay={800}
          style={styles.floatingButtonContainer}
        >
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={handleMyOrdersPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ShopColors.primary, ShopColors.secondary]}
              style={styles.floatingButtonGradient}
            >
              <Icon name="receipt-long" size={24} color={ShopColors.gold} />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: ShopColors.gold,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ShopColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: ShopColors.gold,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  headerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ShopColors.gold + '10',
  },
  quickActionsRowContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    borderRadius: 30,
    padding: 10,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  quickActionItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionItemGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  quickActionItemText: {
    fontSize: 12,
    color: ShopColors.gold,
    marginTop: 4,
    fontWeight: '600',
  },
  categoriesSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ShopColors.gold,
  },
  categoriesContainer: {
    paddingBottom: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCardWrapper: {
    width: (width - 44) / 2,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  categoryGradient: {
    padding: 16,
    position: 'relative',
  },
  categoryGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ShopColors.gold,
  },
  categoryPattern: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    opacity: 0.1,
  },
  patternIcon: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  categoryIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.gold,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 11,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 14,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  shopNowText: {
    fontSize: 12,
    color: ShopColors.gold,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ShopColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  emptyText: {
    fontSize: 16,
    color: ShopColors.textMuted,
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  retryText: {
    color: ShopColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  shopHereSection: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  shopHereCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  shopHereGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  shopHereGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ShopColors.gold,
  },
  shopHereIconContainer: {
    marginRight: 12,
  },
  shopHereIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopHereContent: {
    flex: 1,
  },
  shopHereTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.gold,
    marginBottom: 2,
  },
  shopHereSubtitle: {
    fontSize: 12,
    color: ShopColors.textMuted,
    lineHeight: 16,
  },
  shopHereArrow: {
    marginLeft: 8,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: ShopColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 60,
  },
});

export default EshopHomeScreen;
