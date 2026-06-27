// services/MessageDbService.js
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

class MessageDbService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  // Initialize database
  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('messages.db');
      await this.createTables();
      this.isInitialized = true;
      console.log('✅ Message database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize message database:', error);
      throw error;
    }
  }

  // Create tables
  async createTables() {
    // Conversations table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        chatType TEXT DEFAULT 'normal',
        lastMessage TEXT,
        lastMessageAt TEXT,
        lastMessageSenderId TEXT,
        unreadCount INTEGER DEFAULT 0,
        participants TEXT, -- JSON string
        updatedAt TEXT,
        createdAt TEXT
      )
    `);

    // Messages table
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
        readBy TEXT, -- JSON array
        deliveredTo TEXT, -- JSON array
        tempId TEXT,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updatedAt);
    `);

    console.log('✅ Message tables created');
  }

  // ─── Conversation Methods ──────────────────────────────────────────────

  // Get all conversations
  async getConversations() {
    await this.ensureInit();
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM conversations 
      ORDER BY updatedAt DESC
    `);
    
    return result.map(conv => ({
      ...conv,
      participants: conv.participants ? JSON.parse(conv.participants) : [],
      unreadCount: conv.unreadCount || 0,
    }));
  }

  // Get conversation by ID
  async getConversation(conversationId) {
    await this.ensureInit();
    
    const result = await this.db.getFirstAsync(
      `SELECT * FROM conversations WHERE id = ?`,
      [conversationId]
    );
    
    if (result) {
      result.participants = result.participants ? JSON.parse(result.participants) : [];
    }
    return result;
  }

  // Save or update conversation - FIXED
  async saveConversation(conversation) {
    await this.ensureInit();
    
    // Make sure we're passing primitive values, not objects
    const id = conversation._id || conversation.id || '';
    const chatType = conversation.chatType || 'normal';
    const lastMessage = typeof conversation.lastMessage === 'string' 
      ? conversation.lastMessage 
      : (conversation.lastMessage?.content || conversation.lastMessage || '');
    const lastMessageAt = conversation.lastMessageAt || conversation.updatedAt || new Date().toISOString();
    const lastMessageSenderId = conversation.lastMessageSenderId || '';
    const unreadCount = parseInt(conversation.unreadCount) || 0;
    const participants = JSON.stringify(conversation.participants || []);
    const updatedAt = new Date().toISOString();
    const createdAt = conversation.createdAt || new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO conversations (
        id, chatType, lastMessage, lastMessageAt, lastMessageSenderId,
        unreadCount, participants, updatedAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        chatType,
        lastMessage,
        lastMessageAt,
        lastMessageSenderId,
        unreadCount,
        participants,
        updatedAt,
        createdAt,
      ]
    );
    
    return conversation;
  }

  // Update conversation last message - FIXED
  async updateConversationLastMessage(conversationId, message) {
    await this.ensureInit();
    
    const content = typeof message === 'string' ? message : (message.content || '');
    const createdAt = message?.createdAt || new Date().toISOString();
    const senderId = message?.senderId || message?.sender?._id || '';
    
    await this.db.runAsync(
      `UPDATE conversations 
       SET lastMessage = ?, lastMessageAt = ?, lastMessageSenderId = ?, updatedAt = ?
       WHERE id = ?`,
      [
        content,
        createdAt,
        senderId,
        new Date().toISOString(),
        conversationId,
      ]
    );
  }

  // Increment unread count
  async incrementUnreadCount(conversationId) {
    await this.ensureInit();
    
    await this.db.runAsync(
      `UPDATE conversations 
       SET unreadCount = unreadCount + 1, updatedAt = ?
       WHERE id = ?`,
      [new Date().toISOString(), conversationId]
    );
  }

  // Reset unread count
  async resetUnreadCount(conversationId) {
    await this.ensureInit();
    
    await this.db.runAsync(
      `UPDATE conversations 
       SET unreadCount = 0
       WHERE id = ?`,
      [conversationId]
    );
  }

  // Delete conversation
  async deleteConversation(conversationId) {
    await this.ensureInit();
    
    // Delete messages first (cascade)
    await this.db.runAsync(
      `DELETE FROM messages WHERE conversationId = ?`,
      [conversationId]
    );
    
    // Delete conversation
    await this.db.runAsync(
      `DELETE FROM conversations WHERE id = ?`,
      [conversationId]
    );
  }

  // ─── Message Methods ──────────────────────────────────────────────────

  // Get messages for conversation
  async getMessages(conversationId, limit = 50, offset = 0) {
    await this.ensureInit();
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM messages 
      WHERE conversationId = ? AND isDeleted = 0
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [conversationId, limit, offset]);
    
    return result.map(msg => ({
      ...msg,
      readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
      deliveredTo: msg.deliveredTo ? JSON.parse(msg.deliveredTo) : [],
    }));
  }

  // Get all messages (for full sync)
  async getAllMessages(conversationId) {
    await this.ensureInit();
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM messages 
      WHERE conversationId = ? AND isDeleted = 0
      ORDER BY createdAt ASC
    `, [conversationId]);
    
    return result.map(msg => ({
      ...msg,
      readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
      deliveredTo: msg.deliveredTo ? JSON.parse(msg.deliveredTo) : [],
    }));
  }

  // Save message - FIXED
  async saveMessage(message) {
    await this.ensureInit();
    
    const id = message._id || message.id || '';
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
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO messages (
        id, conversationId, content, senderId, senderName, senderAvatar,
        createdAt, status, messageType, readBy, deliveredTo, tempId, isDeleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        conversationId,
        content,
        senderId,
        senderName,
        senderAvatar,
        createdAt,
        status,
        messageType,
        readBy,
        deliveredTo,
        tempId,
        isDeleted,
      ]
    );
    
    // Update conversation last message
    await this.updateConversationLastMessage(conversationId, {
      content,
      createdAt,
      senderId,
    });
    
    return message;
  }

  // Save multiple messages
  async saveMessages(messages) {
    await this.ensureInit();
    
    for (const message of messages) {
      await this.saveMessage(message);
    }
    
    return messages;
  }

  // Update message status
  async updateMessageStatus(messageId, status) {
    await this.ensureInit();
    
    await this.db.runAsync(
      `UPDATE messages SET status = ? WHERE id = ? OR tempId = ?`,
      [status, messageId, messageId]
    );
  }

  // Mark message as read
  async markMessageRead(messageId, userId) {
    await this.ensureInit();
    
    // Get current readBy
    const msg = await this.db.getFirstAsync(
      `SELECT readBy FROM messages WHERE id = ?`,
      [messageId]
    );
    
    let readBy = msg ? JSON.parse(msg.readBy || '[]') : [];
    if (!readBy.some(r => r.user === userId)) {
      readBy.push({ user: userId, readAt: new Date().toISOString() });
    }
    
    await this.db.runAsync(
      `UPDATE messages SET readBy = ? WHERE id = ?`,
      [JSON.stringify(readBy), messageId]
    );
  }

  // Mark conversation messages as read
  async markConversationMessagesRead(conversationId, userId) {
    await this.ensureInit();
    
    const messages = await this.db.getAllAsync(
      `SELECT id, readBy FROM messages WHERE conversationId = ? AND isDeleted = 0`,
      [conversationId]
    );
    
    for (const msg of messages) {
      let readBy = JSON.parse(msg.readBy || '[]');
      if (!readBy.some(r => r.user === userId)) {
        readBy.push({ user: userId, readAt: new Date().toISOString() });
        await this.db.runAsync(
          `UPDATE messages SET readBy = ? WHERE id = ?`,
          [JSON.stringify(readBy), msg.id]
        );
      }
    }
    
    // Reset unread count
    await this.resetUnreadCount(conversationId);
  }

  // Delete message (soft delete)
  async deleteMessage(messageId) {
    await this.ensureInit();
    
    await this.db.runAsync(
      `UPDATE messages SET isDeleted = 1 WHERE id = ?`,
      [messageId]
    );
  }

  // Get unread count for conversation
  async getUnreadCount(conversationId) {
    await this.ensureInit();
    
    const result = await this.db.getFirstAsync(
      `SELECT unreadCount FROM conversations WHERE id = ?`,
      [conversationId]
    );
    
    return result?.unreadCount || 0;
  }

  // ─── Sync Methods ─────────────────────────────────────────────────────

  // Get messages since timestamp
  async getMessagesSince(conversationId, since) {
    await this.ensureInit();
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM messages 
      WHERE conversationId = ? AND createdAt > ? AND isDeleted = 0
      ORDER BY createdAt ASC
    `, [conversationId, since]);
    
    return result.map(msg => ({
      ...msg,
      readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
      deliveredTo: msg.deliveredTo ? JSON.parse(msg.deliveredTo) : [],
    }));
  }

  // ─── Utility ──────────────────────────────────────────────────────────

  // Ensure database is initialized
  async ensureInit() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  // Clear all data (for testing/logout)
  async clearAll() {
    await this.ensureInit();
    
    await this.db.execAsync(`
      DELETE FROM messages;
      DELETE FROM conversations;
    `);
    
    console.log('✅ All message data cleared');
  }

  // Get database size (for debugging)
  async getSize() {
    await this.ensureInit();
    
    const result = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM messages`
    );
    const convCount = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM conversations`
    );
    
    return {
      messages: result?.count || 0,
      conversations: convCount?.count || 0,
    };
  }
}

// Export singleton instance
export default new MessageDbService();