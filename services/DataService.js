// services/DataService.js
import databaseService from './DatabaseService';

export const DataService = {
  // User preferences
  async setUserTheme(theme) {
    return databaseService.setPreference('user_theme', theme);
  },
  
  async getUserTheme() {
    return databaseService.getPreference('user_theme') || 'light';
  },

  // Search history
  async addSearchHistory(query, type = 'general', metadata = {}) {
    const history = await databaseService.getPreference('search_history') || [];
    const newHistory = [{
      query, 
      type, 
      timestamp: Date.now(),
      ...metadata
    }, ...history.slice(0, 9)]; // Keep only 10 most recent
    return databaseService.setPreference('search_history', newHistory);
  },

  async getSearchHistory(limit = 10) {
    const history = await databaseService.getPreference('search_history') || [];
    return history.slice(0, limit);
  },

  async clearSearchHistory() {
    return databaseService.setPreference('search_history', []);
  },

  // Favorites system
  async addFavorite(item) {
    const favorites = await databaseService.getPreference('user_favorites') || [];
    
    // Check if already favorited
    const existingIndex = favorites.findIndex(fav => 
      fav.id === item.id && fav.type === item.type
    );
    
    if (existingIndex >= 0) {
      // Update existing
      favorites[existingIndex] = { ...item, favoritedAt: Date.now() };
    } else {
      // Add new
      favorites.push({ ...item, favoritedAt: Date.now() });
    }
    
    return databaseService.setPreference('user_favorites', favorites);
  },

  async removeFavorite(itemId, itemType) {
    const favorites = await databaseService.getPreference('user_favorites') || [];
    const newFavorites = favorites.filter(fav => 
      !(fav.id === itemId && fav.type === itemType)
    );
    return databaseService.setPreference('user_favorites', newFavorites);
  },

  async getFavorites(type = null) {
    const favorites = await databaseService.getPreference('user_favorites') || [];
    if (type) {
      return favorites.filter(fav => fav.type === type);
    }
    return favorites;
  },

  async isFavorite(itemId, itemType) {
    const favorites = await this.getFavorites();
    return favorites.some(fav => fav.id === itemId && fav.type === itemType);
  },

  // Recently viewed with DataService wrapper
  async addRecentlyViewed(item) {
    return databaseService.addRecentlyViewed({
      item_id: item.id,
      item_type: item.type,
      title: item.title,
      subtitle: item.description || item.subtitle,
      image_url: item.image || item.imageUrl,
      metadata: {
        screen: item.screen,
        category: item.category,
        price: item.price,
        location: item.location,
        ...item.metadata
      }
    });
  },

  async getRecentlyViewed(limit = 10) {
    return databaseService.getRecentlyViewed(limit);
  },

  async clearRecentlyViewed() {
    // This would require a custom method in databaseService
    // For now, we'll handle it differently
    console.warn('Clear recently viewed not implemented in base service');
    return false;
  },

  // User behavior tracking
  async trackUserAction(userId, action, screen, metadata = {}) {
    return databaseService.saveUserBehavior({
      userId,
      action,
      screen,
      metadata
    });
  },

  async getUserBehavior(userId, limit = 100) {
    return databaseService.getUserBehavior(userId, limit);
  },

  // App settings
  async setAppSetting(key, value) {
    return databaseService.setPreference(`app_setting_${key}`, value);
  },

  async getAppSetting(key, defaultValue = null) {
    return databaseService.getPreference(`app_setting_${key}`) || defaultValue;
  },

  // Notifications preferences
  async setNotificationPreference(type, enabled) {
    const prefs = await databaseService.getPreference('notification_preferences') || {};
    prefs[type] = enabled;
    return databaseService.setPreference('notification_preferences', prefs);
  },

  async getNotificationPreferences() {
    return databaseService.getPreference('notification_preferences') || {
      promotions: true,
      updates: true,
      messages: true,
      new_listings: true,
      price_drops: false
    };
  },

  // User profile cache
  async cacheUserProfile(profile) {
    return databaseService.setPreference('cached_user_profile', {
      ...profile,
      cachedAt: Date.now()
    });
  },

  async getCachedUserProfile() {
    return databaseService.getPreference('cached_user_profile');
  },

  // App usage statistics
  async recordScreenView(screen, metadata = {}) {
    const usage = await databaseService.getPreference('app_usage_stats') || {};
    const today = new Date().toDateString();
    
    if (!usage[today]) {
      usage[today] = {
        screens: {},
        totalViews: 0
      };
    }
    
    if (!usage[today].screens[screen]) {
      usage[today].screens[screen] = 0;
    }
    
    usage[today].screens[screen]++;
    usage[today].totalViews++;
    
    // Also track the view in behavior
    await this.trackUserAction('anonymous', 'screen_view', screen, metadata);
    
    return databaseService.setPreference('app_usage_stats', usage);
  },

  async getAppUsageStats(days = 7) {
    const usage = await databaseService.getPreference('app_usage_stats') || {};
    
    // Get last X days
    const result = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toDateString();
      
      if (usage[dateKey]) {
        result[dateKey] = usage[dateKey];
      }
    }
    
    return result;
  },

  // Shopping cart (if applicable)
  async addToCart(item) {
    const cart = await databaseService.getPreference('shopping_cart') || [];
    
    // Check if item already in cart
    const existingIndex = cart.findIndex(cartItem => 
      cartItem.id === item.id && cartItem.variant === item.variant
    );
    
    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity += (item.quantity || 1);
    } else {
      // Add new item
      cart.push({
        ...item,
        quantity: item.quantity || 1,
        addedAt: Date.now()
      });
    }
    
    return databaseService.setPreference('shopping_cart', cart);
  },

  async removeFromCart(itemId) {
    const cart = await databaseService.getPreference('shopping_cart') || [];
    const newCart = cart.filter(item => item.id !== itemId);
    return databaseService.setPreference('shopping_cart', newCart);
  },

  async getCart() {
    return databaseService.getPreference('shopping_cart') || [];
  },

  async clearCart() {
    return databaseService.setPreference('shopping_cart', []);
  },

  // Wishlist (separate from favorites)
  async addToWishlist(item) {
    const wishlist = await databaseService.getPreference('user_wishlist') || [];
    
    // Avoid duplicates
    if (!wishlist.some(wish => wish.id === item.id)) {
      wishlist.push({
        ...item,
        addedAt: Date.now()
      });
    }
    
    return databaseService.setPreference('user_wishlist', wishlist);
  },

  async removeFromWishlist(itemId) {
    const wishlist = await databaseService.getPreference('user_wishlist') || [];
    const newWishlist = wishlist.filter(item => item.id !== itemId);
    return databaseService.setPreference('user_wishlist', newWishlist);
  },

  async getWishlist() {
    return databaseService.getPreference('user_wishlist') || [];
  },

  // User onboarding status
  async setOnboardingComplete() {
    return databaseService.setPreference('onboarding_complete', true);
  },

  async isOnboardingComplete() {
    return databaseService.getPreference('onboarding_complete') || false;
  },

  // User session data
  async setSessionData(data) {
    return databaseService.setPreference('user_session', {
      ...data,
      lastUpdated: Date.now()
    });
  },

  async getSessionData() {
    return databaseService.getPreference('user_session');
  },

  // Cleanup old data
  async cleanupOldData() {
    try {
      await databaseService.clearOldCache();
      await databaseService.clearOldBehaviorData();
      return true;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return false;
    }
  },

  // Export user data (for GDPR/account export)
  async exportUserData(userId) {
    try {
      const [preferences, behavior, recentlyViewed] = await Promise.all([
        databaseService.getPreference('user_favorites'),
        databaseService.getUserBehavior(userId),
        databaseService.getRecentlyViewed(100)
      ]);

      return {
        preferences: preferences || [],
        behavior: behavior || [],
        recentlyViewed: recentlyViewed || [],
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }
};

// Create a React hook for easier usage
export const useDataService = () => {
  // This would be implemented in a React component
  return DataService;
};

export default DataService;