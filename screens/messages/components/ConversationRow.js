import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import ConversationAvatar from './ConversationAvatar';

const C = {
  bg: '#07201A',
  surface: '#0D2E24',
  border: '#1A3D2E',
  accent: '#34C97A',
  textPrimary: '#E8F5EE',
  textSecondary: '#7CA98A',
  textMeta: '#5A8570',
  danger: '#E05252',
  blue: '#4FC3F7',
  linkme: '#C026D3',
  linkmeLight: '#1A0820',
  system: '#2563EB',
  systemLight: '#0D1B3E',
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffMs / (1000 * 60 * 60 * 24);
  if (diffH < 1) return `${Math.floor(diffMs / (1000 * 60))}m`;
  if (diffH < 24) return `${Math.floor(diffH)}h`;
  if (diffD < 7) return `${Math.floor(diffD)}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getPreviewText = (lastMessage, n = 40) => {
  if (!lastMessage) return '';
  const str = typeof lastMessage === 'string' ? lastMessage : (lastMessage?.content || '');
  return str.length > n ? str.substring(0, n) + '…' : str;
};

const ConversationRow = React.memo(({
  item,
  otherUser,
  isOnline,
  typingText,
  isDeleting,
  onPress,
  onLongPress,
}) => {
  const isLinkMe = item.chatType === 'linkme';
  const isSystem = item.chatType === 'system';
  const preview = typingText || getPreviewText(item.lastMessage) || 'No messages yet';

  if (isDeleting) {
    return (
      <View style={[styles.rowCard, { opacity: 0.45 }]}>
        <ActivityIndicator color={C.accent} style={{ marginRight: 14 }} />
        <Text style={styles.deletingText}>Deleting…</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.rowCard,
        isLinkMe && styles.rowCardLinkMe,
        isSystem && styles.rowCardSystem,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={420}
      activeOpacity={0.72}
    >
      <ConversationAvatar
        user={otherUser}
        isSystem={isSystem}
        isLinkMe={isLinkMe}
        isOnline={isOnline}
      />
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={[
            styles.rowName,
            isLinkMe && { color: '#E879F9' },
            isSystem && { color: C.blue },
          ]} numberOfLines={1}>
            {otherUser?.username || 'Unknown User'}
            {isSystem ? ' · System' : ''}
          </Text>
          <Text style={[styles.rowTime, isSystem && { color: '#93C5FD' }]}>
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text style={[
            styles.rowPreview,
            typingText && styles.rowTyping,
            isSystem && styles.rowPreviewSystem,
          ]} numberOfLines={1}>
            {preview}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[
              styles.unreadBadge,
              isLinkMe && { backgroundColor: C.linkme },
              isSystem && { backgroundColor: C.system },
            ]}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return (
    prev.item._id === next.item._id &&
    prev.item.lastMessage === next.item.lastMessage &&
    prev.item.lastMessageAt === next.item.lastMessageAt &&
    prev.item.unreadCount === next.item.unreadCount &&
    prev.isOnline === next.isOnline &&
    prev.typingText === next.typingText &&
    prev.isDeleting === next.isDeleting &&
    prev.otherUser?.username === next.otherUser?.username
  );
});

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 11,
    marginHorizontal: 12, marginVertical: 3,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  rowCardLinkMe: {
    backgroundColor: C.linkmeLight, borderLeftWidth: 3,
    borderLeftColor: C.linkme, borderColor: 'rgba(192,38,211,0.3)',
  },
  rowCardSystem: {
    backgroundColor: C.systemLight, borderLeftWidth: 3,
    borderLeftColor: C.system, borderColor: 'rgba(37,99,235,0.3)',
  },
  deletingText: { fontSize: 14, color: C.textMeta, fontStyle: 'italic' },
  rowInfo: { flex: 1, justifyContent: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  rowName: { fontSize: 15, fontWeight: '600', color: C.textPrimary, flex: 1, marginRight: 8 },
  rowTime: { fontSize: 11, color: C.textMeta },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowPreview: { fontSize: 13, color: C.textSecondary, flex: 1, marginRight: 8 },
  rowTyping: { color: C.accent, fontStyle: 'italic' },
  rowPreviewSystem: { color: '#93C5FD', fontStyle: 'italic' },
  unreadBadge: {
    backgroundColor: C.accent, borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  unreadText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

export default ConversationRow;