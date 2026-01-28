import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

class LocalServicesDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initialized && this.db) return this.db;
    
    try {
      console.log('📦 Opening local services database...');
      
      // Use a dedicated database file
      this.db = await SQLite.openDatabaseAsync('moihub-services.db');
      
      await this.setupTables();
      
      this.initialized = true;
      console.log('✅ Local services database ready');
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize local services database:', error);
      throw error;
    }
  }

  async setupTables() {
    try {
      // ========== CATEGORIES TABLE ==========
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          allowDashboard INTEGER DEFAULT 0,
          allowBooking INTEGER DEFAULT 0,
          systemOnly INTEGER DEFAULT 0,
          providerCount INTEGER DEFAULT 0,
          isPinned INTEGER DEFAULT 0,
          icon TEXT,
          color TEXT,
          bgColor TEXT,
          sortOrder INTEGER DEFAULT 0,
          lastSynced INTEGER,
          createdAt INTEGER,
          updatedAt INTEGER
        );
      `);
      console.log('✅ Categories table created');

      // ========== PROVIDERS TABLE ==========
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS providers (
          id TEXT PRIMARY KEY,
          providerName TEXT NOT NULL,
          phoneNumber TEXT,
          categoryId TEXT,
          categoryName TEXT,
          areasOfOperation TEXT,
          address TEXT,
          rating REAL DEFAULT 0,
          totalReviews INTEGER DEFAULT 0,
          isApproved INTEGER DEFAULT 0,
          isClaimed INTEGER DEFAULT 0,
          ownerUserId TEXT,
          claimStatus TEXT DEFAULT 'pending',
          subscriptionPlan TEXT DEFAULT 'free',
          subscriptionExpiresAt INTEGER,
          isDashboardEnabled INTEGER DEFAULT 0,
          isBookable INTEGER DEFAULT 0,
          providerType TEXT DEFAULT 'directory',
          actions TEXT,
          lastSynced INTEGER,
          createdAt INTEGER,
          updatedAt INTEGER,
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Providers table created');

      // ========== CATEGORY METADATA ==========
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS category_metadata (
          categoryId TEXT PRIMARY KEY,
          icon TEXT,
          color TEXT,
          bgColor TEXT,
          isPinned INTEGER DEFAULT 0,
          pinnedAt INTEGER,
          customOrder INTEGER DEFAULT 0,
          lastUsed INTEGER,
          usageCount INTEGER DEFAULT 0,
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Category metadata table created');

      // ========== SEARCH HISTORY ==========
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS search_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL,
          categoryId TEXT,
          categoryName TEXT,
          resultCount INTEGER,
          timestamp INTEGER,
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Search history table created');

      // ========== PROVIDER DETAILS CACHE ==========
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS provider_details_cache (
          providerId TEXT PRIMARY KEY,
          data TEXT,
          timestamp INTEGER,
          expiresAt INTEGER
        );
      `);
      console.log('✅ Provider details cache table created');

      // ========== CREATE INDEXES ==========
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
        CREATE INDEX IF NOT EXISTS idx_categories_pinned ON categories(isPinned);
        CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(categoryId);
        CREATE INDEX IF NOT EXISTS idx_providers_claimed ON providers(isClaimed);
        CREATE INDEX IF NOT EXISTS idx_providers_bookable ON providers(isBookable);
        CREATE INDEX IF NOT EXISTS idx_search_timestamp ON search_history(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_cache_expires ON provider_details_cache(expiresAt);
      `);
      console.log('✅ Indexes created');

      // ========== INSERT DEFAULT PINNED CATEGORIES ==========
      // This ensures we always have pinned categories even when offline
      await this.insertDefaultPinnedCategories();

    } catch (error) {
      console.error('❌ Failed to setup tables:', error);
      throw error;
    }
  }

  async insertDefaultPinnedCategories() {
    try {
      const defaultPinned = [
        {
          id: 'pinned_motorbike',
          name: 'Motorbike Services',
          description: 'Bike repair, maintenance & parts',
          icon: 'bicycle',
          color: '#2D6A4F',
          bgColor: '#2D6A4F20',
          isPinned: 1,
          sortOrder: 1,
          allowBooking: 1,
          allowDashboard: 1
        },
        {
          id: 'pinned_matatu',
          name: 'Matatu Services',
          description: 'Public transport & commute',
          icon: 'bus',
          color: '#40916C',
          bgColor: '#40916C20',
          isPinned: 1,
          sortOrder: 2,
          allowBooking: 1,
          allowDashboard: 1
        },
        {
          id: 'pinned_boda',
          name: 'Boda Boda',
          description: 'Quick rides & delivery',
          icon: 'bicycle',
          color: '#52B788',
          bgColor: '#52B78820',
          isPinned: 1,
          sortOrder: 3,
          allowBooking: 1,
          allowDashboard: 1
        },
        {
          id: 'pinned_transport',
          name: 'Transport',
          description: 'All transport services',
          icon: 'car',
          color: '#74C69D',
          bgColor: '#74C69D20',
          isPinned: 1,
          sortOrder: 4,
          allowBooking: 1,
          allowDashboard: 1
        }
      ];

      for (const category of defaultPinned) {
        await this.db.runAsync(
          `INSERT OR IGNORE INTO categories 
           (id, name, description, icon, color, bgColor, isPinned, sortOrder, 
            allowBooking, allowDashboard, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            category.id,
            category.name,
            category.description,
            category.icon,
            category.color,
            category.bgColor,
            category.isPinned,
            category.sortOrder,
            category.allowBooking,
            category.allowDashboard,
            Date.now(),
            Date.now()
          ]
        );
      }
      console.log('✅ Default pinned categories inserted');
    } catch (error) {
      console.warn('⚠️ Could not insert default pinned categories:', error);
    }
  }

  // ========== CATEGORY METHODS ==========
  async saveCategories(categories) {
    if (!this.db) return false;
    
    try {
      await this.db.runAsync('BEGIN TRANSACTION');
      
      for (const category of categories) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO categories 
           (id, name, description, allowDashboard, allowBooking, systemOnly, 
            icon, color, bgColor, isPinned, lastSynced, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            category._id || category.id,
            category.name,
            category.description || '',
            category.allowDashboard ? 1 : 0,
            category.allowBooking ? 1 : 0,
            category.systemOnly ? 1 : 0,
            category.icon,
            category.color,
            category.bgColor,
            category.isPinned ? 1 : 0,
            Date.now(),
            category.createdAt || Date.now(),
            category.updatedAt || Date.now()
          ]
        );
      }
      
      await this.db.runAsync('COMMIT');
      console.log(`💾 Saved ${categories.length} categories`);
      return true;
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('❌ Error saving categories:', error);
      return false;
    }
  }

  async getCategories() {
    if (!this.db) return [];
    
    try {
      const categories = await this.db.getAllAsync(`
        SELECT c.*, 
               COALESCE(p.providerCount, 0) as providerCount
        FROM categories c
        LEFT JOIN (
          SELECT categoryId, COUNT(*) as providerCount 
          FROM providers 
          WHERE isApproved = 1 
          GROUP BY categoryId
        ) p ON c.id = p.categoryId
        ORDER BY 
          c.isPinned DESC,
          c.sortOrder ASC,
          c.name ASC
      `);
      
      return categories.map(cat => ({
        ...cat,
        _id: cat.id,
        allowDashboard: Boolean(cat.allowDashboard),
        allowBooking: Boolean(cat.allowBooking),
        systemOnly: Boolean(cat.systemOnly),
        isPinned: Boolean(cat.isPinned),
        providerCount: cat.providerCount || 0
      }));
    } catch (error) {
      console.error('❌ Error getting categories:', error);
      return [];
    }
  }

  async getPinnedCategories() {
    if (!this.db) return [];
    
    try {
      const categories = await this.db.getAllAsync(`
        SELECT * FROM categories 
        WHERE isPinned = 1 
        ORDER BY sortOrder ASC, name ASC
      `);
      
      return categories.map(cat => ({
        ...cat,
        _id: cat.id,
        isPinned: true
      }));
    } catch (error) {
      console.error('❌ Error getting pinned categories:', error);
      return [];
    }
  }

  async updateCategoryMetadata(categoryId, metadata) {
    if (!this.db) return;
    
    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO category_metadata 
         (categoryId, icon, color, bgColor, isPinned, pinnedAt, customOrder, lastUsed, usageCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryId,
          metadata.icon,
          metadata.color,
          metadata.bgColor,
          metadata.isPinned ? 1 : 0,
          metadata.pinnedAt || Date.now(),
          metadata.customOrder || 0,
          Date.now(),
          (metadata.usageCount || 0) + 1
        ]
      );
    } catch (error) {
      console.error('❌ Error updating category metadata:', error);
    }
  }

  // ========== PROVIDER METHODS ==========
  async saveProviders(categoryId, providers) {
    if (!this.db) return false;
    
    try {
      await this.db.runAsync('BEGIN TRANSACTION');
      
      // Clear old providers for this category
      await this.db.runAsync(
        'DELETE FROM providers WHERE categoryId = ?',
        [categoryId]
      );
      
      // Insert new providers
      for (const provider of providers) {
        await this.db.runAsync(
          `INSERT INTO providers 
           (id, providerName, phoneNumber, categoryId, categoryName, areasOfOperation, 
            address, rating, totalReviews, isApproved, isClaimed, 
            isDashboardEnabled, isBookable, providerType, actions, lastSynced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            provider.id,
            provider.name || provider.providerName,
            provider.phone,
            categoryId,
            provider.categoryName,
            provider.areasOfOperation ? JSON.stringify(provider.areasOfOperation) : '[]',
            provider.address,
            provider.rating || 0,
            provider.totalReviews || 0,
            provider.isApproved ? 1 : 0,
            provider.providerType === 'dashboard' ? 1 : 0,
            provider.providerType === 'dashboard' ? 1 : 0,
            provider.isBookable ? 1 : 0,
            provider.providerType || 'directory',
            JSON.stringify(provider.actions || []),
            Date.now()
          ]
        );
      }
      
      await this.db.runAsync('COMMIT');
      console.log(`💾 Saved ${providers.length} providers for category ${categoryId}`);
      return true;
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('❌ Error saving providers:', error);
      return false;
    }
  }

  async getProviders(categoryId) {
    if (!this.db) return [];
    
    try {
      const providers = await this.db.getAllAsync(`
        SELECT * FROM providers 
        WHERE categoryId = ? 
        ORDER BY 
          isDashboardEnabled DESC,
          rating DESC,
          providerName ASC
      `, [categoryId]);
      
      return providers.map(provider => ({
        ...provider,
        _id: provider.id,
        isApproved: Boolean(provider.isApproved),
        isClaimed: Boolean(provider.isClaimed),
        isDashboardEnabled: Boolean(provider.isDashboardEnabled),
        isBookable: Boolean(provider.isBookable),
        areasOfOperation: provider.areasOfOperation ? JSON.parse(provider.areasOfOperation) : [],
        actions: provider.actions ? JSON.parse(provider.actions) : []
      }));
    } catch (error) {
      console.error('❌ Error getting providers:', error);
      return [];
    }
  }

  async searchProviders(query) {
    if (!this.db) return [];
    
    try {
      const providers = await this.db.getAllAsync(`
        SELECT p.*, c.name as categoryName 
        FROM providers p
        JOIN categories c ON p.categoryId = c.id
        WHERE p.providerName LIKE ? OR c.name LIKE ?
        ORDER BY 
          CASE 
            WHEN p.providerName LIKE ? THEN 1
            WHEN c.name LIKE ? THEN 2
            ELSE 3
          END,
          p.rating DESC
        LIMIT 50
      `, [`%${query}%`, `%${query}%`, `${query}%`, `${query}%`]);
      
      return providers.map(provider => ({
        ...provider,
        _id: provider.id,
        isDashboardEnabled: Boolean(provider.isDashboardEnabled),
        isBookable: Boolean(provider.isBookable)
      }));
    } catch (error) {
      console.error('❌ Error searching providers:', error);
      return [];
    }
  }

  // ========== SEARCH METHODS ==========
  async saveSearch(query, categoryId = null, categoryName = null, resultCount = 0) {
    if (!this.db) return;
    
    try {
      await this.db.runAsync(
        `INSERT INTO search_history (query, categoryId, categoryName, resultCount, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [query, categoryId, categoryName, resultCount, Date.now()]
      );
    } catch (error) {
      console.error('❌ Error saving search:', error);
    }
  }

  async getRecentSearches(limit = 10) {
    if (!this.db) return [];
    
    try {
      return await this.db.getAllAsync(
        'SELECT * FROM search_history ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );
    } catch (error) {
      console.error('❌ Error getting recent searches:', error);
      return [];
    }
  }

  async clearSearchHistory() {
    if (!this.db) return;
    
    try {
      await this.db.runAsync('DELETE FROM search_history');
    } catch (error) {
      console.error('❌ Error clearing search history:', error);
    }
  }

  // ========== CACHE METHODS ==========
  async cacheProviderDetails(providerId, data, ttlHours = 24) {
    if (!this.db) return;
    
    try {
      const expiresAt = Date.now() + (ttlHours * 60 * 60 * 1000);
      
      await this.db.runAsync(
        `INSERT OR REPLACE INTO provider_details_cache 
         (providerId, data, timestamp, expiresAt)
         VALUES (?, ?, ?, ?)`,
        [providerId, JSON.stringify(data), Date.now(), expiresAt]
      );
    } catch (error) {
      console.error('❌ Error caching provider details:', error);
    }
  }

  async getCachedProviderDetails(providerId) {
    if (!this.db) return null;
    
    try {
      const now = Date.now();
      const result = await this.db.getFirstAsync(
        `SELECT * FROM provider_details_cache 
         WHERE providerId = ? AND expiresAt > ?`,
        [providerId, now]
      );
      
      if (result) {
        return JSON.parse(result.data);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached provider details:', error);
      return null;
    }
  }

  async clearExpiredCache() {
    if (!this.db) return;
    
    try {
      await this.db.runAsync(
        'DELETE FROM provider_details_cache WHERE expiresAt <= ?',
        [Date.now()]
      );
    } catch (error) {
      console.error('❌ Error clearing expired cache:', error);
    }
  }

  // ========== UTILITY METHODS ==========
  async getLastSyncTime() {
    if (!this.db) return 0;
    
    try {
      const result = await this.db.getFirstAsync(
        'SELECT MAX(lastSynced) as lastSync FROM categories'
      );
      return result?.lastSync || 0;
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return 0;
    }
  }

  async clearAllData() {
    if (!this.db) return;
    
    try {
      await this.db.execAsync(`
        DELETE FROM categories;
        DELETE FROM providers;
        DELETE FROM category_metadata;
        DELETE FROM search_history;
        DELETE FROM provider_details_cache;
      `);
      console.log('🧹 Cleared all services data');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
    }
  }

  async getDatabaseInfo() {
    if (!this.db) return null;
    
    try {
      const [categoryCount, providerCount, searchCount, cacheCount] = await Promise.all([
        this.db.getFirstAsync('SELECT COUNT(*) as count FROM categories'),
        this.db.getFirstAsync('SELECT COUNT(*) as count FROM providers'),
        this.db.getFirstAsync('SELECT COUNT(*) as count FROM search_history'),
        this.db.getFirstAsync('SELECT COUNT(*) as count FROM provider_details_cache'),
      ]);
      
      const dbSize = await this.db.getFirstAsync(
        "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
      );
      
      return {
        categories: categoryCount?.count || 0,
        providers: providerCount?.count || 0,
        searches: searchCount?.count || 0,
        cachedProviders: cacheCount?.count || 0,
        databaseSize: dbSize?.size || 0
      };
    } catch (error) {
      console.error('❌ Error getting database info:', error);
      return null;
    }
  }

  async close() {
    if (this.db) {
      // Close any open connections if needed
      this.initialized = false;
    }
  }
}

// Singleton instance
const localServicesDB = new LocalServicesDatabase();
export default localServicesDB;