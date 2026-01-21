// services/RentalDataService.js
import * as SQLite from 'expo-sqlite';

class RentalDataService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.databaseName = 'rentals.db';
  }

  async initialize() {
    if (this.isInitialized) return this.db;

    try {
      this.db = await SQLite.openDatabaseAsync(this.databaseName);
      
      // Enable WAL mode for better concurrency
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
      `);
      
      await this.createTables();
      this.isInitialized = true;
      console.log('✅ Rental database initialized');
      return this.db;
    } catch (error) {
      console.error('❌ Rental database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    try {
      await this.db.execAsync(`
        -- Rentals table
        CREATE TABLE IF NOT EXISTS rentals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rental_id TEXT UNIQUE,
          name TEXT,
          location TEXT,
          type TEXT,
          amount REAL,
          description TEXT,
          has_vacant BOOLEAN,
          contact_phone TEXT,
          contact_email TEXT,
          images TEXT,
          amenities TEXT,
          admin_override TEXT,
          vote_stats TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          is_active BOOLEAN DEFAULT 1,
          last_synced INTEGER DEFAULT (strftime('%s', 'now')),
          metadata TEXT
        );

        -- Rental views tracking
        CREATE TABLE IF NOT EXISTS rental_views (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rental_id TEXT,
          rental_name TEXT,
          viewed_at INTEGER DEFAULT (strftime('%s', 'now')),
          metadata TEXT
        );

        -- Search history
        CREATE TABLE IF NOT EXISTS search_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT,
          filters TEXT,
          result_count INTEGER,
          searched_at INTEGER DEFAULT (strftime('%s', 'now')),
          metadata TEXT
        );

        -- Rental fetches tracking
        CREATE TABLE IF NOT EXISTS rental_fetches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page INTEGER,
          count INTEGER,
          source TEXT,
          fetched_at INTEGER DEFAULT (strftime('%s', 'now')),
          metadata TEXT
        );

        -- Cache metadata
        CREATE TABLE IF NOT EXISTS cache_metadata (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Save rentals to cache
  async saveRentalsToCache(rentals) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync('BEGIN TRANSACTION');
      
      // Clear old rentals
      await this.db.runAsync('DELETE FROM rentals');
      
      // Insert new rentals
      for (const rental of rentals) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO rentals (
            rental_id, name, location, type, amount, description,
            has_vacant, contact_phone, contact_email, images,
            amenities, admin_override, vote_stats, created_at,
            updated_at, is_active, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rental._id,
            rental.name,
            rental.location,
            rental.type,
            rental.amount,
            rental.description,
            rental.hasVacant ? 1 : 0,
            rental.contactPhone,
            rental.contactEmail,
            JSON.stringify(rental.images || []),
            JSON.stringify(rental.amenities || []),
            JSON.stringify(rental.adminOverride || {}),
            JSON.stringify(rental.voteStats || {}),
            rental.createdAt ? new Date(rental.createdAt).getTime() : Date.now(),
            rental.updatedAt ? new Date(rental.updatedAt).getTime() : Date.now(),
            1,
            JSON.stringify({
              source: 'api',
              cached_at: Date.now()
            })
          ]
        );
      }
      
      await this.db.runAsync('COMMIT');
      
      // Update last updated timestamp
      await this.updateCacheMetadata('last_updated', Date.now());
      await this.updateCacheMetadata('rental_count', rentals.length.toString());
      
      console.log(`✅ Cached ${rentals.length} rentals`);
      return true;
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('Error saving rentals to cache:', error);
      return false;
    }
  }

  // Get cached rentals
  async getCachedRentals(limit = 100) {
    if (!this.isInitialized) await this.initialize();

    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM rentals WHERE is_active = 1 ORDER BY last_synced DESC LIMIT ?`,
        [limit]
      );
      
      return result.map(row => ({
        _id: row.rental_id,
        name: row.name,
        location: row.location,
        type: row.type,
        amount: row.amount,
        description: row.description,
        hasVacant: row.has_vacant === 1,
        contactPhone: row.contact_phone,
        contactEmail: row.contact_email,
        images: JSON.parse(row.images || '[]'),
        amenities: JSON.parse(row.amenities || '[]'),
        adminOverride: JSON.parse(row.admin_override || '{}'),
        voteStats: JSON.parse(row.vote_stats || '{}'),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } catch (error) {
      console.error('Error getting cached rentals:', error);
      return [];
    }
  }

  // Save search results
  async saveSearchResults(results, searchParams) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync('BEGIN TRANSACTION');
      
      // Save search to history
      await this.db.runAsync(
        `INSERT INTO search_history (query, filters, result_count, metadata) VALUES (?, ?, ?, ?)`,
        [
          searchParams.query || '',
          JSON.stringify(searchParams.filters || {}),
          results.length,
          JSON.stringify({
            timestamp: Date.now(),
            source: 'search'
          })
        ]
      );
      
      // Keep only last 50 searches
      await this.db.runAsync(
        `DELETE FROM search_history WHERE id NOT IN (
          SELECT id FROM search_history ORDER BY searched_at DESC LIMIT 50
        )`
      );
      
      await this.db.runAsync('COMMIT');
      return true;
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('Error saving search results:', error);
      return false;
    }
  }

  // Get cached search results
  async getCachedSearchResults(query, filters) {
    if (!this.isInitialized) await this.initialize();

    try {
      // For now, return all cached rentals
      // In a more advanced version, you could implement search indexing
      const allRentals = await this.getCachedRentals();
      
      // Simple client-side filtering
      const normalizedQuery = query.toLowerCase();
      const normalizedFilters = {};
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          normalizedFilters[key] = filters[key].toString().toLowerCase();
        }
      });
      
      return allRentals.filter(rental => {
        // Check search query
        const matchesQuery = !query || 
          rental.name.toLowerCase().includes(normalizedQuery) ||
          rental.location.toLowerCase().includes(normalizedQuery) ||
          rental.type.toLowerCase().includes(normalizedQuery);
        
        // Check filters
        const matchesFilters = Object.keys(normalizedFilters).every(key => {
          switch (key) {
            case 'location':
              return rental.location.toLowerCase().includes(normalizedFilters[key]);
            case 'type':
              return rental.type.toLowerCase() === normalizedFilters[key];
            case 'minPrice':
              return rental.amount >= parseFloat(normalizedFilters[key]);
            case 'maxPrice':
              return rental.amount <= parseFloat(normalizedFilters[key]);
            case 'vacancyStatus':
              // Implement vacancy status filtering logic
              return true;
            default:
              return true;
          }
        });
        
        return matchesQuery && matchesFilters;
      });
    } catch (error) {
      console.error('Error getting cached search results:', error);
      return [];
    }
  }

  // Track rental view
  async trackRentalView(rentalId, rentalName) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(
        `INSERT INTO rental_views (rental_id, rental_name, metadata) VALUES (?, ?, ?)`,
        [
          rentalId,
          rentalName,
          JSON.stringify({
            timestamp: Date.now(),
            source: 'rental_home'
          })
        ]
      );
      
      // Keep only last 100 views
      await this.db.runAsync(
        `DELETE FROM rental_views WHERE id NOT IN (
          SELECT id FROM rental_views ORDER BY viewed_at DESC LIMIT 100
        )`
      );
      
      return true;
    } catch (error) {
      console.error('Error tracking rental view:', error);
      return false;
    }
  }

  // Track rental fetch
  async trackRentalFetch(fetchData) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(
        `INSERT INTO rental_fetches (page, count, source, metadata) VALUES (?, ?, ?, ?)`,
        [
          fetchData.page || 1,
          fetchData.count || 0,
          fetchData.source || 'unknown',
          JSON.stringify({
            timestamp: Date.now(),
            ...fetchData.metadata
          })
        ]
      );
      return true;
    } catch (error) {
      console.error('Error tracking rental fetch:', error);
      return false;
    }
  }

  // Track rental search
  async trackRentalSearch(searchData) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(
        `INSERT INTO search_history (query, filters, result_count, metadata) VALUES (?, ?, ?, ?)`,
        [
          searchData.query || '',
          JSON.stringify(searchData.filters || {}),
          searchData.resultCount || 0,
          JSON.stringify({
            timestamp: Date.now(),
            source: 'rental_home',
            ...searchData.metadata
          })
        ]
      );
      return true;
    } catch (error) {
      console.error('Error tracking rental search:', error);
      return false;
    }
  }

  // Cache metadata helpers
  async updateCacheMetadata(key, value) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO cache_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
        [key, value.toString(), Math.floor(Date.now() / 1000)]
      );
      return true;
    } catch (error) {
      console.error('Error updating cache metadata:', error);
      return false;
    }
  }

  async getCacheMetadata(key) {
    if (!this.isInitialized) await this.initialize();

    try {
      const result = await this.db.getFirstAsync(
        `SELECT value FROM cache_metadata WHERE key = ?`,
        [key]
      );
      return result ? result.value : null;
    } catch (error) {
      console.error('Error getting cache metadata:', error);
      return null;
    }
  }

  async getLastUpdated() {
    const lastUpdated = await this.getCacheMetadata('last_updated');
    return lastUpdated ? parseInt(lastUpdated) : null;
  }

  async getRentalCount() {
    const count = await this.getCacheMetadata('rental_count');
    return count ? parseInt(count) : 0;
  }

  // Clear cache
  async clearCache() {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync('BEGIN TRANSACTION');
      await this.db.runAsync('DELETE FROM rentals');
      await this.db.runAsync('DELETE FROM cache_metadata');
      await this.db.runAsync('COMMIT');
      return true;
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Get rental by ID
  async getRentalById(rentalId) {
    if (!this.isInitialized) await this.initialize();

    try {
      const result = await this.db.getFirstAsync(
        `SELECT * FROM rentals WHERE rental_id = ? AND is_active = 1`,
        [rentalId]
      );
      
      if (!result) return null;
      
      return {
        _id: result.rental_id,
        name: result.name,
        location: result.location,
        type: result.type,
        amount: result.amount,
        description: result.description,
        hasVacant: result.has_vacant === 1,
        contactPhone: result.contact_phone,
        contactEmail: result.contact_email,
        images: JSON.parse(result.images || '[]'),
        amenities: JSON.parse(result.amenities || '[]'),
        adminOverride: JSON.parse(result.admin_override || '{}'),
        voteStats: JSON.parse(result.vote_stats || '{}'),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        metadata: JSON.parse(result.metadata || '{}')
      };
    } catch (error) {
      console.error('Error getting rental by ID:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const rentalDataService = new RentalDataService();
export default rentalDataService;