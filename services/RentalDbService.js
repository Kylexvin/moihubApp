// services/RentalDbService.js
import * as SQLite from 'expo-sqlite';

class RentalDbService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  // Initialize database - only once!
  async init() {
    // If already initialized, return immediately
    if (this.isInitialized) {
      console.log('✅ Rental DB already initialized, skipping...');
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      console.log('⏳ Rental DB initialization in progress, waiting...');
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  async _doInit() {
    try {
      console.log('🔨 Initializing rental database...');
      this.db = await SQLite.openDatabaseAsync('rentals.db');
      
      // Check if tables exist before creating
      const tableExists = await this.db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='rentals'"
      );

      if (!tableExists) {
        await this.createTables();
        console.log('✅ Rental tables created');
      } else {
        console.log('✅ Rental tables already exist, skipping creation');
      }
      
      this.isInitialized = true;
      console.log('✅ Rental database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize rental database:', error);
      this.isInitialized = false;
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  // Create tables - only if they don't exist
  async createTables() {
    if (!this.db) return;

    // Rentals table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS rentals (
        id TEXT PRIMARY KEY,
        name TEXT,
        location TEXT,
        type TEXT,
        amount INTEGER,
        description TEXT,
        imageUrl TEXT,
        locationUrl TEXT,
        hasVacant INTEGER DEFAULT 0,
        vacancyStatus TEXT DEFAULT 'unverified',
        createdAt TEXT,
        updatedAt TEXT,
        adminOverride TEXT,
        voteStats TEXT,
        isDeleted INTEGER DEFAULT 0
      )
    `);

    // Votes table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        rentalId TEXT,
        userId TEXT,
        hasVacancy INTEGER,
        createdAt TEXT,
        FOREIGN KEY (rentalId) REFERENCES rentals(id) ON DELETE CASCADE
      )
    `);

    // Inquiries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        rentalId TEXT,
        userName TEXT,
        userWhatsApp TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT,
        FOREIGN KEY (rentalId) REFERENCES rentals(id) ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_rentals_location ON rentals(location);
      CREATE INDEX IF NOT EXISTS idx_rentals_type ON rentals(type);
      CREATE INDEX IF NOT EXISTS idx_rentals_vacancy ON rentals(vacancyStatus);
      CREATE INDEX IF NOT EXISTS idx_votes_rental ON votes(rentalId);
      CREATE INDEX IF NOT EXISTS idx_inquiries_rental ON inquiries(rentalId);
    `);
  }

  // ─── Ensure DB is initialized ───
  async ensureInit() {
    if (this.isInitialized) {
      return;
    }
    await this.init();
  }

  // ─── Rental Methods ──────────────────────────────────────────────────────

  // Get all rentals with pagination
  async getRentals(page = 1, limit = 10, filters = {}) {
    await this.ensureInit();
    
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE isDeleted = 0';
    const params = [];
    
    // Build filter conditions
    if (filters.location) {
      whereClause += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }
    if (filters.type) {
      whereClause += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.vacancyStatus) {
      whereClause += ' AND vacancyStatus = ?';
      params.push(filters.vacancyStatus);
    }
    if (filters.minPrice) {
      whereClause += ' AND amount >= ?';
      params.push(parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      whereClause += ' AND amount <= ?';
      params.push(parseInt(filters.maxPrice));
    }

    // Get total count
    const countResult = await this.db.getFirstAsync(
      `SELECT COUNT(*) as total FROM rentals ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // Get rentals
    const result = await this.db.getAllAsync(
      `SELECT * FROM rentals ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: result.map(rental => ({
        ...rental,
        hasVacant: rental.hasVacant === 1,
        adminOverride: rental.adminOverride ? JSON.parse(rental.adminOverride) : null,
        voteStats: rental.voteStats ? JSON.parse(rental.voteStats) : null,
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total,
        limit: limit,
      },
    };
  }

  // Get single rental by ID
  async getRentalById(rentalId) {
    await this.ensureInit();
    
    const result = await this.db.getFirstAsync(
      `SELECT * FROM rentals WHERE id = ? AND isDeleted = 0`,
      [rentalId]
    );

    if (result) {
      return {
        ...result,
        hasVacant: result.hasVacant === 1,
        adminOverride: result.adminOverride ? JSON.parse(result.adminOverride) : null,
        voteStats: result.voteStats ? JSON.parse(result.voteStats) : null,
      };
    }
    return null;
  }

  // Save or update rental
  async saveRental(rental) {
    await this.ensureInit();
    
    const id = rental._id || rental.id || '';
    const name = rental.name || '';
    const location = rental.location || '';
    const type = rental.type || '';
    const amount = rental.amount || 0;
    const description = rental.description || '';
    const imageUrl = rental.imageUrl || '';
    const locationUrl = rental.locationUrl || '';
    const hasVacant = rental.hasVacant ? 1 : 0;
    const vacancyStatus = rental.vacancyStatus || 'unverified';
    const createdAt = rental.createdAt || new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const adminOverride = JSON.stringify(rental.adminOverride || null);
    const voteStats = JSON.stringify(rental.voteStats || { totalVotes: 0, vacantVotes: 0, occupiedVotes: 0 });
    const isDeleted = rental.isDeleted ? 1 : 0;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO rentals (
        id, name, location, type, amount, description, imageUrl, locationUrl,
        hasVacant, vacancyStatus, createdAt, updatedAt, adminOverride, voteStats, isDeleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, location, type, amount, description, imageUrl, locationUrl,
        hasVacant, vacancyStatus, createdAt, updatedAt, adminOverride, voteStats, isDeleted
      ]
    );

    return rental;
  }

  // Save multiple rentals
  async saveRentals(rentals) {
    await this.ensureInit();
    
    for (const rental of rentals) {
      await this.saveRental(rental);
    }
    
    return rentals;
  }

  // Update rental vacancy status
  async updateVacancyStatus(rentalId, hasVacant, vacancyStatus = 'verified_vacant') {
    await this.ensureInit();
    
    await this.db.runAsync(
      `UPDATE rentals 
       SET hasVacant = ?, vacancyStatus = ?, updatedAt = ?
       WHERE id = ?`,
      [hasVacant ? 1 : 0, vacancyStatus, new Date().toISOString(), rentalId]
    );
  }

  // Update rental votes
  async updateVoteStats(rentalId, voteStats) {
    await this.ensureInit();
    
    await this.db.runAsync(
      `UPDATE rentals 
       SET voteStats = ?, updatedAt = ?
       WHERE id = ?`,
      [JSON.stringify(voteStats), new Date().toISOString(), rentalId]
    );
  }

  // Delete rental (soft delete)
  async deleteRental(rentalId) {
    await this.ensureInit();
    
    await this.db.runAsync(
      `UPDATE rentals SET isDeleted = 1 WHERE id = ?`,
      [rentalId]
    );
  }

  // ─── Vote Methods ──────────────────────────────────────────────────────

  // Save vote
  async saveVote(vote) {
    await this.ensureInit();
    
    const id = vote._id || vote.id || `vote_${Date.now()}_${Math.random()}`;
    const rentalId = vote.rentalId || '';
    const userId = vote.userId || '';
    const hasVacancy = vote.hasVacancy ? 1 : 0;
    const createdAt = vote.createdAt || new Date().toISOString();

    await this.db.runAsync(
      `INSERT OR REPLACE INTO votes (id, rentalId, userId, hasVacancy, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [id, rentalId, userId, hasVacancy, createdAt]
    );

    return vote;
  }

  // Get votes for rental
  async getVotesForRental(rentalId) {
    await this.ensureInit();
    
    const result = await this.db.getAllAsync(
      `SELECT * FROM votes WHERE rentalId = ?`,
      [rentalId]
    );

    return result.map(vote => ({
      ...vote,
      hasVacancy: vote.hasVacancy === 1,
    }));
  }

  // Get user's vote for rental
  async getUserVote(rentalId, userId) {
    await this.ensureInit();
    
    const result = await this.db.getFirstAsync(
      `SELECT * FROM votes WHERE rentalId = ? AND userId = ?`,
      [rentalId, userId]
    );

    if (result) {
      return {
        ...result,
        hasVacancy: result.hasVacancy === 1,
      };
    }
    return null;
  }

  // ─── Inquiry Methods ──────────────────────────────────────────────────

  // Save inquiry
  async saveInquiry(inquiry) {
    await this.ensureInit();
    
    const id = inquiry._id || inquiry.id || `inquiry_${Date.now()}_${Math.random()}`;
    const rentalId = inquiry.rentalId || '';
    const userName = inquiry.userName || '';
    const userWhatsApp = inquiry.userWhatsApp || '';
    const message = inquiry.message || '';
    const status = inquiry.status || 'pending';
    const createdAt = inquiry.createdAt || new Date().toISOString();

    await this.db.runAsync(
      `INSERT OR REPLACE INTO inquiries (id, rentalId, userName, userWhatsApp, message, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, rentalId, userName, userWhatsApp, message, status, createdAt]
    );

    return inquiry;
  }

  // Get inquiries for rental
  async getInquiriesForRental(rentalId) {
    await this.ensureInit();
    
    const result = await this.db.getAllAsync(
      `SELECT * FROM inquiries WHERE rentalId = ? ORDER BY createdAt DESC`,
      [rentalId]
    );

    return result;
  }

  // ─── Search Methods ──────────────────────────────────────────────────

  // Search rentals
  async searchRentals(query, filters = {}, page = 1, limit = 10) {
    await this.ensureInit();
    
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE isDeleted = 0';
    const params = [];

    if (query && query.trim()) {
      whereClause += ' AND (name LIKE ? OR location LIKE ?)';
      const searchTerm = `%${query.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.location) {
      whereClause += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }
    if (filters.type) {
      whereClause += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.vacancyStatus) {
      whereClause += ' AND vacancyStatus = ?';
      params.push(filters.vacancyStatus);
    }
    if (filters.minPrice) {
      whereClause += ' AND amount >= ?';
      params.push(parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      whereClause += ' AND amount <= ?';
      params.push(parseInt(filters.maxPrice));
    }

    const countResult = await this.db.getFirstAsync(
      `SELECT COUNT(*) as total FROM rentals ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    const result = await this.db.getAllAsync(
      `SELECT * FROM rentals ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: result.map(rental => ({
        ...rental,
        hasVacant: rental.hasVacant === 1,
        adminOverride: rental.adminOverride ? JSON.parse(rental.adminOverride) : null,
        voteStats: rental.voteStats ? JSON.parse(rental.voteStats) : null,
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total,
        limit: limit,
      },
    };
  }

  // ─── Utility ──────────────────────────────────────────────────────────

  // Clear all data (for testing)
  async clearAll() {
    await this.ensureInit();
    
    await this.db.execAsync(`
      DELETE FROM inquiries;
      DELETE FROM votes;
      DELETE FROM rentals;
    `);
    
    console.log('✅ All rental data cleared');
  }

  // Get database stats
  async getStats() {
    await this.ensureInit();
    
    const rentalCount = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM rentals WHERE isDeleted = 0`
    );
    const voteCount = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM votes`
    );
    const inquiryCount = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM inquiries`
    );
    
    return {
      rentals: rentalCount?.count || 0,
      votes: voteCount?.count || 0,
      inquiries: inquiryCount?.count || 0,
    };
  }
}

// Export singleton instance
export default new RentalDbService();