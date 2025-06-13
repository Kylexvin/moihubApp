import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';

const NewChatScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [defaultUsers, setDefaultUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const { currentUser, token, logout, isAuthenticated } = useAuth();
  const BASE_URL = 'http://192.168.100.51:5000/api';

  useEffect(() => {
    if (!isAuthenticated || !token) {
      logout();
      return;
    }
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delay = setTimeout(() => searchUsers(), 500);
      return () => clearTimeout(delay);
    } else {
      setUsers([]);
      setSearchPerformed(false);
    }
  }, [searchQuery]);

  const handleAuthError = () => {
    Alert.alert('Session Expired', 'Please log in again.', [
      { text: 'OK', onPress: () => logout() }
    ]);
  };

  const fetchSuggestedUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/users/suggested`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDefaultUsers(data);
      } else if (res.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Suggested fetch error:', err);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) return;

    if (!token) return handleAuthError();

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/messages/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setSearchPerformed(true);
      } else if (res.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (user) => {
    try {
      const res = await fetch(`${BASE_URL}/messages/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId: user._id }),
      });

      if (res.ok) {
        const convo = await res.json();
        navigation.replace('ChatScreen', {
          conversationId: convo._id,
          conversation: convo,
          otherUser: user
        });
      } else if (res.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Conversation error:', err);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => startConversation(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Icon name="chat" size={20} color="#007AFF" />
    </TouchableOpacity>
  );

  const dataToRender = searchPerformed ? users : defaultUsers;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>

      </View>

 

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by username or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <FlatList
            data={dataToRender}
            keyExtractor={(item) => item._id}
            renderItem={renderUserItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="person-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No users</Text>
                <Text style={styles.emptySubtitle}>
                  {searchPerformed ? 'No match found.' : 'No suggested users available.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  logoutButton: {
    padding: 4,
  },
 profileContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  backgroundColor: '#f5f5f5',
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
},

avatarCircle: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#ccc',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},

avatarText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},

profileTextContainer: {
  flexDirection: 'column',
},

profileName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#222',
},

profileUsername: {
  fontSize: 12,
  color: '#666',
},

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  resultsContainer: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default NewChatScreen;