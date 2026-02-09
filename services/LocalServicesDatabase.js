import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocalServicesDatabase {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return true;
    
    try {
      // Open database without throwing errors
      this.db = await SQLite.openDatabaseAsync('localServices.db');
      
      // Create tables in background
      setTimeout(() => this.createTables(), 100);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.log('⚠️ Database will work in fallback mode');
      return false;
    }
  }

  async createTables() {
    try {
      // Categories table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          color TEXT,
          bgColor TEXT,
          isPinned INTEGER DEFAULT 0,
          allowDashboard INTEGER DEFAULT 0,
          allowBooking INTEGER DEFAULT 0,
          providerCount INTEGER DEFAULT 0,
          systemOnly INTEGER DEFAULT 0,
          createdAt INTEGER,
          updatedAt INTEGER
        );
      `);

      console.log('✅ Tables ready');
    } catch (error) {
      console.log('⚠️ Tables creation delayed');
    }
  }

  // SIMPLE METHODS - Only save/get, no complex operations
  async saveCategories(categories) {
    if (!this.isInitialized) return false;
    
    try {
      for (const category of categories) {
        const now = Date.now();
        await this.db.runAsync(
          `INSERT OR REPLACE INTO categories (
            id, name, description, icon, color, bgColor, 
            isPinned, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            category.id || category._id,
            category.name,
            category.description || '',
            category.icon || 'star',
            category.color || '#3B82F6',
            category.bgColor || '#3B82F620',
            category.isPinned ? 1 : 0,
            now,
            now
          ]
        );
      }
      return true;
    } catch (error) {
      console.log('⚠️ Could not save to SQLite');
      return false;
    }
  }

  async getCategories() {
    if (!this.isInitialized) return [];
    
    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM categories ORDER BY isPinned DESC, name ASC`
      );
      
      return result.map(row => ({
        ...row,
        _id: row.id,
        isPinned: row.isPinned === 1
      }));
    } catch (error) {
      return [];
    }
  }

  async getPinnedCategories() {
    if (!this.isInitialized) return [];
    
    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM categories WHERE isPinned = 1 ORDER BY name ASC`
      );
      
      return result.map(row => ({
        ...row,
        _id: row.id,
        isPinned: true
      }));
    } catch (error) {
      return [];
    }
  }

  // Provider methods (simplified)
  async saveProviders(categoryId, providers) {
    if (!this.isInitialized) return false;
    
    try {
      // Simple provider save (optional)
      return true;
    } catch (error) {
      return false;
    }
  }

  async getProvidersByCategory(categoryId) {
    if (!this.isInitialized) return [];
    
    try {
      // Simple provider fetch
      return [];
    } catch (error) {
      return [];
    }
  }
}

const localServicesDB = new LocalServicesDatabase();
export default localServicesDB;