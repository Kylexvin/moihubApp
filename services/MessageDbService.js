// services/MessageDbService.js
import * as SQLite from 'expo-sqlite';

class MessageDbService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null; // Track initialization promise
  }

  async init() {
    // If already initialized, return immediately
    if (this.isInitialized && this.db) {
      return this.db;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  async _initialize() {
    try {
      console.log('🔄 Initializing database...');
      
      // Close any existing connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (e) {
          // Ignore close errors
        }
        this.db = null;
      }

      // Open database
      this.db = await SQLite.openDatabaseAsync('messages.db');
      
      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('✅ Message database initialized');
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize message database:', error);
      this.isInitialized = false;
      this.initPromise = null;
      throw error;
    }
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          chatType TEXT DEFAULT 'normal',
          lastMessage TEXT,
          lastMessageAt TEXT,
          lastMessageSenderId TEXT,
          unreadCount INTEGER DEFAULT 0,
          participants TEXT,
          updatedAt TEXT,
          createdAt TEXT
        )
      `);

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversationId TEXT,
          content TEXT,
          senderId TEXT,
          senderName TEXT,
          senderAvatar TEXT,
          createdAt TEXT,
          status TEXT DEFAULT 'sent',
          messageType TEXT DEFAULT 'text',
          readBy TEXT,
          deliveredTo TEXT,
          tempId TEXT,
          isDeleted INTEGER DEFAULT 0,
          FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
        )
      `);

      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId);
        CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt);
        CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updatedAt);
      `);

      console.log('✅ Message tables created');
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
      throw error;
    }
  }

  // ─── All other methods with proper error handling ───

  async ensureInit() {
    try {
      await this.init();
      return this.db;
    } catch (error) {
      console.warn('⚠️ Database not available, using fallback:', error);
      return null;
    }
  }

  async getConversations() {
    const db = await this.ensureInit();
    if (!db) return [];

    try {
      const result = await db.getAllAsync(`
        SELECT * FROM conversations
        ORDER BY updatedAt DESC
      `);

      return result.map(conv => ({
        ...conv,
        _id: conv.id,
        participants: conv.participants ? JSON.parse(conv.participants) : [],
        unreadCount: conv.unreadCount || 0,
      }));
    } catch (error) {
      console.warn('Failed to get conversations:', error);
      return [];
    }
  }

  async saveConversation(conversation) {
    const db = await this.ensureInit();
    if (!db) return conversation;

    try {
      const id = (conversation._id || conversation.id || '').toString();
      const chatType = conversation.chatType || 'normal';
      const lastMessage = typeof conversation.lastMessage === 'string'
        ? conversation.lastMessage
        : (conversation.lastMessage?.content || '');
      const lastMessageAt = conversation.lastMessageAt || conversation.updatedAt || new Date().toISOString();
      const lastMessageSenderId = conversation.lastMessageSenderId || '';
      const unreadCount = parseInt(conversation.unreadCount) || 0;
      const participants = JSON.stringify(conversation.participants || []);
      const updatedAt = new Date().toISOString();
      const createdAt = conversation.createdAt || new Date().toISOString();

      await db.runAsync(
        `INSERT OR REPLACE INTO conversations (
          id, chatType, lastMessage, lastMessageAt, lastMessageSenderId,
          unreadCount, participants, updatedAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, chatType, lastMessage, lastMessageAt, lastMessageSenderId,
         unreadCount, participants, updatedAt, createdAt]
      );

      return conversation;
    } catch (error) {
      console.warn('Failed to save conversation:', error);
      return conversation;
    }
  }

  async getMessages(conversationId, limit = 50, offset = 0) {
    const db = await this.ensureInit();
    if (!db) return [];

    try {
      const result = await db.getAllAsync(`
        SELECT * FROM messages
        WHERE conversationId = ? AND isDeleted = 0
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `, [conversationId, limit, offset]);

      return result.map(msg => ({
        ...msg,
        _id: msg.id,
        readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
        deliveredTo: msg.deliveredTo ? JSON.parse(msg.deliveredTo) : [],
      }));
    } catch (error) {
      console.warn('Failed to get messages:', error);
      return [];
    }
  }

  async saveMessage(message) {
    const db = await this.ensureInit();
    if (!db) return message;

    try {
      const id = (message._id || message.id || '').toString();
      const conversationId = message.conversationId || message.conversation || '';
      const content = message.content || '';
      const senderId = message.senderId || message.sender?._id || '';
      const senderName = message.senderName || message.sender?.username || 'Unknown';
      const senderAvatar = message.senderAvatar || message.sender?.avatar || '';
      const createdAt = message.createdAt || new Date().toISOString();
      const status = message.status || 'sent';
      const messageType = message.messageType || 'text';
      const readBy = JSON.stringify(message.readBy || []);
      const deliveredTo = JSON.stringify(message.deliveredTo || []);
      const tempId = message.tempId || null;
      const isDeleted = message.isDeleted ? 1 : 0;

      await db.runAsync(
        `INSERT OR REPLACE INTO messages (
          id, conversationId, content, senderId, senderName, senderAvatar,
          createdAt, status, messageType, readBy, deliveredTo, tempId, isDeleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, conversationId, content, senderId, senderName, senderAvatar,
         createdAt, status, messageType, readBy, deliveredTo, tempId, isDeleted]
      );

      return message;
    } catch (error) {
      console.warn('Failed to save message:', error);
      return message;
    }
  }

  async deleteConversation(conversationId) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM messages WHERE conversationId = ?', [conversationId]);
      await db.runAsync('DELETE FROM conversations WHERE id = ?', [conversationId]);
    } catch (error) {
      console.warn('Failed to delete conversation:', error);
    }
  }

  async deleteMessage(messageId) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.runAsync('UPDATE messages SET isDeleted = 1 WHERE id = ?', [messageId]);
    } catch (error) {
      console.warn('Failed to delete message:', error);
    }
  }

  async updateMessageStatus(messageId, status) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.runAsync(
        'UPDATE messages SET status = ? WHERE id = ? OR tempId = ?',
        [status, messageId, messageId]
      );
    } catch (error) {
      console.warn('Failed to update message status:', error);
    }
  }

  async markMessageRead(messageId, userId) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      const msg = await db.getFirstAsync(
        'SELECT readBy FROM messages WHERE id = ?', [messageId]
      );

      let readBy = msg ? JSON.parse(msg.readBy || '[]') : [];
      if (!readBy.some(r => r.user === userId)) {
        readBy.push({ user: userId, readAt: new Date().toISOString() });
      }

      await db.runAsync(
        'UPDATE messages SET readBy = ? WHERE id = ?',
        [JSON.stringify(readBy), messageId]
      );
    } catch (error) {
      console.warn('Failed to mark message read:', error);
    }
  }

  async markConversationMessagesRead(conversationId, userId) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      const messages = await db.getAllAsync(
        'SELECT id, readBy FROM messages WHERE conversationId = ? AND isDeleted = 0',
        [conversationId]
      );

      for (const msg of messages) {
        let readBy = JSON.parse(msg.readBy || '[]');
        if (!readBy.some(r => r.user === userId)) {
          readBy.push({ user: userId, readAt: new Date().toISOString() });
          await db.runAsync(
            'UPDATE messages SET readBy = ? WHERE id = ?',
            [JSON.stringify(readBy), msg.id]
          );
        }
      }

      await this.resetUnreadCount(conversationId);
    } catch (error) {
      console.warn('Failed to mark conversation messages read:', error);
    }
  }

  async resetUnreadCount(conversationId) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.runAsync(
        'UPDATE conversations SET unreadCount = 0 WHERE id = ?',
        [conversationId]
      );
    } catch (error) {
      console.warn('Failed to reset unread count:', error);
    }
  }

  async clearAll() {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.execAsync('DELETE FROM messages; DELETE FROM conversations;');
      console.log('✅ All message data cleared');
    } catch (error) {
      console.warn('Failed to clear all data:', error);
    }
  }

  async getSize() {
    const db = await this.ensureInit();
    if (!db) return { messages: 0, conversations: 0 };

    try {
      const msgs = await db.getFirstAsync('SELECT COUNT(*) as count FROM messages');
      const convs = await db.getFirstAsync('SELECT COUNT(*) as count FROM conversations');
      return { messages: msgs?.count || 0, conversations: convs?.count || 0 };
    } catch (error) {
      console.warn('Failed to get size:', error);
      return { messages: 0, conversations: 0 };
    }
  }
}

export default new MessageDbService();