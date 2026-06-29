import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Animated, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

// Components
import ConversationRow from './components/ConversationRow';
import ChatTabs from './components/ChatTabs';
import SearchBar from './components/SearchBar';
import ConnectionStatus from './components/ConnectionStatus';
import EmptyState from './components/EmptyState';
import ActionSheet from './components/ActionSheet';
import FAB from './components/FAB';

// Hooks
import { useConversations } from './hooks/useConversations';
import { useSocket } from './hooks/useSocket';
import { useTyping } from './hooks/useTyping';
import { useFilteredConversations } from './hooks/useFilteredConversations';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#07201A',
  headerBg: '#092318',
  surface: '#0D2E24',
  border: '#1A3D2E',
  accent: '#34C97A',
  textPrimary: '#E8F5EE',
  textSecondary: '#7CA98A',
  textMeta: '#5A8570',
  overlay: 'rgba(4,14,10,0.82)',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ChatListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // ── State ──
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // ── Hooks ──
  const {
    conversations,
    loading,
    refreshing,
    dbInitialized,
    deletingId,
    getOtherUser,
    deleteConversation,
    onRefresh,
    setConversationsAnimated,
  } = useConversations();

  const {
    connectionState,
    onlineUsers,
    typingUsers,
  } = useSocket({
    dbInitialized,
    onNewMessage: (message) => {
      // Handle new message - will be implemented
    },
    onConversationUpdated: (updated) => {
      // Handle conversation update - will be implemented
    },
    onMessageRead: (conversationId) => {
      // Handle message read - will be implemented
    },
  });

  const { getTypingText } = useTyping(typingUsers, currentUser?._id);

  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    filteredConversations,
    tabCount,
  } = useFilteredConversations(conversations, getOtherUser);

  // ── Action Sheet Handlers ──
  const openActionSheet = useCallback((conversation) => {
    setSelectedConversation(conversation);
    setActionSheetVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 160,
      friction: 9,
    }).start();
  }, [sheetAnim]);

  const closeActionSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setActionSheetVisible(false);
      setSelectedConversation(null);
    });
  }, [sheetAnim]);

  const handleDelete = async () => {
    if (!selectedConversation) return;
    closeActionSheet();
    const success = await deleteConversation(selectedConversation._id);
    if (!success) {
      // Optionally re-open or show error
    }
  };

  const handleOpenChat = () => {
    if (!selectedConversation) return;
    const other = getOtherUser(selectedConversation);
    closeActionSheet();
    setTimeout(() => {
      navigation.navigate('ChatScreen', {
        conversationId: selectedConversation._id,
        conversation: selectedConversation,
        otherUser: other,
        chatType: selectedConversation.chatType || 'normal',
      });
    }, 220);
  };

  // ── Render ──
  const renderItem = useCallback(({ item }) => {
    const otherUser = getOtherUser(item);
    const isOnline = onlineUsers.has(String(otherUser?._id));
    const typingText = getTypingText(item._id);
    const isDeleting = deletingId === item._id;

    return (
      <ConversationRow
        item={item}
        otherUser={otherUser}
        isOnline={isOnline}
        typingText={typingText}
        isDeleting={isDeleting}
        onPress={() => {
          navigation.navigate('ChatScreen', {
            conversationId: item._id,
            conversation: item,
            otherUser,
            chatType: item.chatType || 'normal',
          });
        }}
        onLongPress={() => openActionSheet(item)}
      />
    );
  }, [getOtherUser, onlineUsers, getTypingText, deletingId, navigation, openActionSheet]);

  const keyExtractor = useCallback((item) => item._id, []);

  // ── Loading ──
  if (loading && !dbInitialized) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor={C.headerBg} barStyle="light-content" translucent={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.loadingText}>Loading conversations…</Text>
        </View>
      </View>
    );
  }

  // ── Main ──
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={C.headerBg} barStyle="light-content" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <ConnectionStatus status={connectionState} />
      </View>

      {/* Search */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Tabs */}
      <ChatTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCount}
      />

      {/* List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState tab={activeTab} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 && { flexGrow: 1 },
        ]}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={12}
        windowSize={10}
        initialNumToRender={12}
      />

      {/* FAB */}
      <FAB
        onPress={() => navigation.navigate('NewChatScreen')}
        position={{ right: 20, bottom: insets.bottom + 24 }}
      />

      {/* Action Sheet */}
      <ActionSheet
        visible={actionSheetVisible}
        onClose={closeActionSheet}
        conversation={selectedConversation}
        onDelete={handleDelete}
        onOpenChat={handleOpenChat}
        getOtherUser={getOtherUser}
        sheetAnim={sheetAnim}
        insets={insets}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.2 },
  listContent: { paddingTop: 8, paddingBottom: 88 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: C.textSecondary },
});

export default ChatListScreen;