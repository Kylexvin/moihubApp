// screens/messages/NewChatScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#07201A',
  surface:      '#0D2E24',
  surfaceAlt:   '#0A2820',
  headerBg:     '#092318',
  own:          '#1B5E3B',
  border:       '#1A3D2E',
  accent:       '#34C97A',
  accentMuted:  '#1E6640',
  white:        '#FFFFFF',
  textPrimary:  '#E8F5EE',
  textSecondary:'#7CA98A',
  textMeta:     '#5A8570',
  danger:       '#E05252',
  blue:         '#4FC3F7',
};

const BASE_URL = 'https://moihub.onrender.com/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avatarPalette = ['#1B6B45','#2D5A8E','#7B3FA0','#B05A1A','#2E7D6B','#6B3A1B','#1B4A6B'];

const getAvatarColor = (username) => {
  if (!username) return avatarPalette[0];
  return avatarPalette[username.charCodeAt(0) % avatarPalette.length];
};

const getInitial = (username) => (username || '?')[0].toUpperCase();

// ─── Avatar ───────────────────────────────────────────────────────────────────
const UserAvatar = React.memo(({ username, size = 46 }) => (
  <View style={[
    styles.avatarCircle,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: getAvatarColor(username),
    },
  ]}>
    <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>
      {getInitial(username)}
    </Text>
  </View>
));

// ─── User row ─────────────────────────────────────────────────────────────────
const UserRow = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.userRow}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <UserAvatar username={item.username} />
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{item.username}</Text>
      <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
    </View>
    <View style={styles.chatChip}>
      <Icon name="chat-bubble-outline" size={14} color={C.accent} />
      <Text style={styles.chatChipText}>Chat</Text>
    </View>
  </TouchableOpacity>
));

// ─── Section header ───────────────────────────────────────────────────────────
const SectionLabel = ({ label, count }) => (
  <View style={styles.sectionLabel}>
    <Text style={styles.sectionLabelText}>{label}</Text>
    {count > 0 && (
      <View style={styles.sectionCount}>
        <Text style={styles.sectionCountText}>{count}</Text>
      </View>
    )}
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const NewChatScreen = ({ navigation }) => {
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchResults,   setSearchResults]   = useState([]);
  const [suggestedUsers,  setSuggestedUsers]  = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingSuggested,setLoadingSuggested]= useState(true);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [starting,        setStarting]        = useState(null); // userId being started

  const searchDebounce = useRef(null);
  const inputRef       = useRef(null);
  const { currentUser, token, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) { logout(); return; }
    fetchSuggested();
    // Auto-focus search on mount
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    searchDebounce.current = setTimeout(() => {
      searchUsers(searchQuery.trim());
    }, 400);

    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  const handleAuthError = () => {
    Alert.alert('Session Expired', 'Please log in again.', [
      { text: 'OK', onPress: logout },
    ]);
  };

  const fetchSuggested = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/users/suggested`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data);
      } else if (res.status === 401) {
        handleAuthError();
      }
    } catch { /* silent */ }
    finally { setLoadingSuggested(false); }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/messages/users/search?query=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setSearchPerformed(true);
      } else if (res.status === 401) {
        handleAuthError();
      }
    } catch {
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (user) => {
    if (starting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStarting(user._id);
    try {
      const res = await fetch(`${BASE_URL}/messages/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: user._id, chatType: 'normal' }),
      });
      if (res.ok) {
        const convo = await res.json();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('ChatScreen', {
          conversationId: convo._id,
          conversation: convo,
          otherUser: user,
          chatType: convo.chatType || 'normal',
        });
      } else if (res.status === 401) {
        handleAuthError();
      } else {
        Alert.alert('Error', 'Could not start conversation.');
      }
    } catch {
      Alert.alert('Error', 'Could not start conversation.');
    } finally {
      setStarting(null);
    }
  };

  const renderItem = useCallback(({ item }) => (
    <UserRow
      item={item}
      onPress={() => startConversation(item)}
    />
  ), [starting]);

  const showSearch   = searchQuery.trim().length > 0;
  const displayList  = showSearch ? searchResults : suggestedUsers;
  const sectionTitle = showSearch ? 'Results' : 'Suggested';
  const isListEmpty  = displayList.length === 0;

  const renderEmpty = () => {
    if (loading || loadingSuggested) return null;
    return (
      <View style={styles.emptyWrap}>
        <Icon
          name={showSearch ? 'search-off' : 'people-outline'}
          size={56}
          color={C.textMeta}
        />
        <Text style={styles.emptyTitle}>
          {showSearch ? 'No users found' : 'No suggestions yet'}
        </Text>
        <Text style={styles.emptySub}>
          {showSearch
            ? `No results for "${searchQuery}"`
            : 'Start typing to search for people'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={C.headerBg} barStyle="light-content" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Icon name="arrow-back" size={22} color={C.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={C.textMeta} style={{ marginRight: 8 }} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search by username or email…"
              placeholderTextColor={C.textMeta}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {loading ? (
              <ActivityIndicator size="small" color={C.accent} style={{ marginLeft: 6 }} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="clear" size={18} color={C.textMeta} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Section label */}
        {!isListEmpty && (
          <SectionLabel
            label={sectionTitle}
            count={displayList.length}
          />
        )}

        {/* List */}
        {loadingSuggested && !showSearch ? (
          <View style={styles.centeredLoader}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadingText}>Finding people…</Text>
          </View>
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              isListEmpty && { flexGrow: 1 },
            ]}
            keyboardShouldPersistTaps="handled"
          />
        )}

      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: C.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: {
    padding: 7,
    width: 36,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.1,
  },

  // Search
  searchWrap: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: C.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.textPrimary,
  },

  // Section label
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 8,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMeta,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    backgroundColor: C.own,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  sectionCountText: {
    fontSize: 10,
    color: C.accent,
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  avatarCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: C.white,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: C.textMeta,
  },
  chatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,201,122,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,201,122,0.3)',
    gap: 5,
  },
  chatChipText: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '600',
  },

  // Empty
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.textSecondary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: C.textMeta,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Loading
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.textSecondary,
  },
});

export default NewChatScreen;