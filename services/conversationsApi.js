// services/conversationsApi.js
const BASE_URL = 'http://192.168.100.51:5000/api';

class ConversationsAPI {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async fetchConversations() {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${BASE_URL}/messages/conversations`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error('Failed to fetch conversations');
    }

    return response.json();
  }

  async deleteConversation(conversationId) {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${BASE_URL}/messages/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error('Failed to delete conversation');
    }

    return response.json();
  }
}

export default new ConversationsAPI();