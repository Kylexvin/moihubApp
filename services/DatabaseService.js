// services/DatabaseService.js
import * as SQLite from 'expo-sqlite';

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initPromise = this.init();
    this.initPromise.catch(error => {
      console.error('❌ Database initialization failed:', error);
    });
  }

  async init() {
    try {
      console.log('📦 Opening SQLite database...');
      
      // Use the new async API
      this.db = await SQLite.openDatabaseAsync('moihub.db');
      
      console.log('✅ SQLite database opened successfully');
      
      await this.setupTables();
      this.initialized = true;
      console.log('🎉 Database initialization completed');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      this.initialized = false;
      throw error;
    }
  }

  async setupTables() {
    try {
      // Execute each table creation separately
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS homescreen_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT UNIQUE,
          data TEXT,
          timestamp INTEGER,
          created_at DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Homescreen cache table ready');

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE,
          value TEXT,
          created_at DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ User preferences table ready');

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS recently_viewed (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT,
          item_type TEXT,
          title TEXT,
          subtitle TEXT,
          image_url TEXT,
          metadata TEXT,
          viewed_at DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Recently viewed table ready');

      // User behavior tracking table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_behavior (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          action TEXT,
          screen TEXT,
          metadata TEXT,
          timestamp INTEGER,
          created_at DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ User behavior table ready');
      
      // Create indexes for better performance
      await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);');
      await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON user_behavior(action);');
      await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_user_behavior_screen ON user_behavior(screen);');
      await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON user_behavior(timestamp);');
      
      console.log('🎉 All database tables setup completed');
    } catch (error) {
      console.error('❌ Error setting up tables:', error);
      throw error;
    }
  }

  // Cache methods using async API
  async setCache(key, data) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for setCache');
        return null;
      }

      await this.db.runAsync(
        'INSERT OR REPLACE INTO homescreen_cache (cache_key, data, timestamp) VALUES (?, ?, ?)',
        [key, JSON.stringify(data), Date.now()]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error caching data:', error);
      return null;
    }
  }

  async getCache(key) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getCache');
        return null;
      }

      const result = await this.db.getFirstAsync(
        'SELECT data, timestamp FROM homescreen_cache WHERE cache_key = ?',
        [key]
      );
      
      if (result) {
        const cachedData = {
          data: JSON.parse(result.data),
          timestamp: result.timestamp
        };
        return cachedData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error retrieving cache:', error);
      return null;
    }
  }

  async clearOldCache(maxAge = 24 * 60 * 60 * 1000) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for clearOldCache');
        return null;
      }

      const cutoffTime = Date.now() - maxAge;
      await this.db.runAsync(
        'DELETE FROM homescreen_cache WHERE timestamp < ?',
        [cutoffTime]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing old cache:', error);
      return null;
    }
  }

  // Recently viewed methods
  async addRecentlyViewed(item) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for addRecentlyViewed');
        return null;
      }

      // Remove duplicate first
      await this.db.runAsync(
        'DELETE FROM recently_viewed WHERE item_id = ? AND item_type = ?',
        [item.item_id, item.item_type]
      );

      // Insert new record
      await this.db.runAsync(
        `INSERT INTO recently_viewed 
         (item_id, item_type, title, subtitle, image_url, metadata) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.item_id,
          item.item_type,
          item.title,
          item.subtitle,
          item.image_url,
          JSON.stringify(item.metadata || {})
        ]
      );
      
      // Keep only last 50 items
      await this.db.runAsync(
        `DELETE FROM recently_viewed 
         WHERE id NOT IN (
           SELECT id FROM recently_viewed 
           ORDER BY viewed_at DESC 
           LIMIT 50
         )`
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error adding recently viewed:', error);
      return null;
    }
  }

  async getRecentlyViewed(limit = 10) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getRecentlyViewed');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM recently_viewed 
         ORDER BY viewed_at DESC 
         LIMIT ?`,
        [limit]
      );
      
      const items = result.map(row => ({
        ...row,
        metadata: JSON.parse(row.metadata || '{}')
      }));
      
      return items;
    } catch (error) {
      console.error('❌ Error retrieving recently viewed:', error);
      return [];
    }
  }

  // User preferences methods
  async setPreference(key, value) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for setPreference');
        return null;
      }

      await this.db.runAsync(
        'INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error saving preference:', error);
      return null;
    }
  }

  async getPreference(key) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getPreference');
        return null;
      }

      const result = await this.db.getFirstAsync(
        'SELECT value FROM user_preferences WHERE key = ?',
        [key]
      );
      
      if (result) {
        return JSON.parse(result.value);
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error retrieving preference:', error);
      return null;
    }
  }

  // User behavior tracking
  async saveUserBehavior(behavior) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for saveUserBehavior');
        return null;
      }

      await this.db.runAsync(
        `INSERT INTO user_behavior 
         (user_id, action, screen, metadata, timestamp) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          behavior.userId,
          behavior.action,
          behavior.screen,
          JSON.stringify(behavior.metadata || {}),
          Date.now()
        ]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error saving user behavior:', error);
      return null;
    }
  }

  async getUserBehavior(userId, limit = 100) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getUserBehavior');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM user_behavior 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [userId, limit]
      );
      
      const behaviors = result.map(row => ({
        ...row,
        metadata: JSON.parse(row.metadata || '{}')
      }));
      
      return behaviors;
    } catch (error) {
      console.error('❌ Error retrieving user behavior:', error);
      return [];
    }
  }

  async getUserBehaviorByAction(userId, action, limit = 50) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getUserBehaviorByAction');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM user_behavior 
         WHERE user_id = ? AND action = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [userId, action, limit]
      );
      
      const behaviors = result.map(row => ({
        ...row,
        metadata: JSON.parse(row.metadata || '{}')
      }));
      
      return behaviors;
    } catch (error) {
      console.error('❌ Error retrieving user behavior by action:', error);
      return [];
    }
  }

  async getUserBehaviorByScreen(userId, screen, limit = 50) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getUserBehaviorByScreen');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM user_behavior 
         WHERE user_id = ? AND screen = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [userId, screen, limit]
      );
      
      const behaviors = result.map(row => ({
        ...row,
        metadata: JSON.parse(row.metadata || '{}')
      }));
      
      return behaviors;
    } catch (error) {
      console.error('❌ Error retrieving user behavior by screen:', error);
      return [];
    }
  }

  async getMostFrequentActions(userId, limit = 10) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getMostFrequentActions');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT action, COUNT(*) as count 
         FROM user_behavior 
         WHERE user_id = ? 
         GROUP BY action 
         ORDER BY count DESC 
         LIMIT ?`,
        [userId, limit]
      );
      
      return result;
    } catch (error) {
      console.error('❌ Error retrieving most frequent actions:', error);
      return [];
    }
  }

  async getMostVisitedScreens(userId, limit = 10) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getMostVisitedScreens');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT screen, COUNT(*) as count 
         FROM user_behavior 
         WHERE user_id = ? 
         GROUP BY screen 
         ORDER BY count DESC 
         LIMIT ?`,
        [userId, limit]
      );
      
      return result;
    } catch (error) {
      console.error('❌ Error retrieving most visited screens:', error);
      return [];
    }
  }

  async clearOldBehaviorData(maxAge = 30 * 24 * 60 * 60 * 1000) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for clearOldBehaviorData');
        return null;
      }

      const cutoffTime = Date.now() - maxAge;
      await this.db.runAsync(
        'DELETE FROM user_behavior WHERE timestamp < ?',
        [cutoffTime]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing old behavior data:', error);
      return null;
    }
  }

  // Analytics helper methods
  async getUserEngagementStats(userId) {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for getUserEngagementStats');
        return null;
      }

      // Get total actions count
      const totalActionsResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM user_behavior WHERE user_id = ?',
        [userId]
      );

      // Get last active time
      const lastActiveResult = await this.db.getFirstAsync(
        'SELECT MAX(timestamp) as last_active FROM user_behavior WHERE user_id = ?',
        [userId]
      );

      // Get actions by day (last 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const dailyActionsResult = await this.db.getAllAsync(
        `SELECT 
           DATE(timestamp / 1000, 'unixepoch') as date,
           COUNT(*) as count
         FROM user_behavior 
         WHERE user_id = ? AND timestamp > ?
         GROUP BY DATE(timestamp / 1000, 'unixepoch')
         ORDER BY date DESC`,
        [userId, sevenDaysAgo]
      );

      return {
        totalActions: totalActionsResult?.count || 0,
        lastActive: lastActiveResult?.last_active || null,
        dailyActivity: dailyActionsResult,
        userId
      };
    } catch (error) {
      console.error('❌ Error getting user engagement stats:', error);
      return null;
    }
  }

  // Database maintenance - reset database (for development)
  async resetDatabase() {
    try {
      if (!this.db) {
        console.warn('⚠️ Database not available for reset');
        return false;
      }

      console.log('🔄 Resetting database...');
      
      await this.db.execAsync('DROP TABLE IF EXISTS homescreen_cache');
      await this.db.execAsync('DROP TABLE IF EXISTS user_preferences');
      await this.db.execAsync('DROP TABLE IF EXISTS recently_viewed');
      await this.db.execAsync('DROP TABLE IF EXISTS user_behavior');
      
      console.log('🗑️ All tables dropped');
      
      // Recreate tables
      await this.setupTables();
      
      console.log('✅ Database reset completed');
      return true;
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      return false;
    }
  }

  // Database info
  async getDatabaseInfo() {
    try {
      if (!this.db) {
        return { error: 'Database not initialized' };
      }

      const cacheCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM homescreen_cache');
      const recentCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM recently_viewed');
      const behaviorCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM user_behavior');
      const preferencesCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM user_preferences');
      
      return {
        cacheCount: cacheCount?.count || 0,
        recentCount: recentCount?.count || 0,
        behaviorCount: behaviorCount?.count || 0,
        preferencesCount: preferencesCount?.count || 0,
        initialized: this.initialized,
        dbExists: !!this.db
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return { error: error.message };
    }
  }

  // Wait for database to be ready
  async isReady() {
    try {
      await this.initPromise;
      return this.initialized;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

// Export for debugging
if (__DEV__) {
  global.databaseService = databaseService;
  
  // Add reset method for development
  global.resetDatabase = () => databaseService.resetDatabase();
  global.getDatabaseInfo = () => databaseService.getDatabaseInfo();
}

export default databaseService; 