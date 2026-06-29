import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const C = {
  surface: '#0D2E24',
  surfaceAlt: '#0A2820',
  border: '#1A3D2E',
  accent: '#34C97A',
  textPrimary: '#E8F5EE',
  textMeta: '#5A8570',
  textSecondary: '#7CA98A',
  danger: '#E05252',
  overlay: 'rgba(4,14,10,0.82)',
};

const avatarPalette = ['#1B6B45','#2D5A8E','#7B3FA0','#B05A1A','#2E7D6B','#6B3A1B','#1B4A6B'];

const getAvatarColor = (username) => {
  if (!username) return avatarPalette[0];
  return avatarPalette[username.charCodeAt(0) % avatarPalette.length];
};

const getInitial = (username) => (username || '?')[0].toUpperCase();

const getPreviewText = (lastMessage, n = 40) => {
  if (!lastMessage) return '';
  const str = typeof lastMessage === 'string' ? lastMessage : (lastMessage?.content || '');
  return str.length > n ? str.substring(0, n) + '…' : str;
};

const ActionSheet = ({
  visible,
  onClose,
  conversation,
  onDelete,
  onOpenChat,
  getOtherUser,
  sheetAnim,
  insets,
}) => {
  if (!conversation) return null;
  const other = getOtherUser(conversation);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets?.bottom + 20 || 20 },
            {
              transform: [{
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              }],
              opacity: sheetAnim,
            },
          ]}
        >
          <View style={styles.sheetPreview}>
            <View style={[styles.sheetPreviewAvatar, { backgroundColor: getAvatarColor(other?.username) }]}>
              <Text style={styles.sheetPreviewInitial}>{getInitial(other?.username)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetPreviewName}>{other?.username || 'Unknown'}</Text>
              <Text style={styles.sheetPreviewSub} numberOfLines={1}>
                {getPreviewText(conversation.lastMessage, 36) || 'No messages yet'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.sheetItem} onPress={onOpenChat}>
            <View style={[styles.sheetIconWrap, { backgroundColor: 'rgba(52,201,122,0.14)' }]}>
              <Icon name="chat-bubble-outline" size={18} color={C.accent} />
            </View>
            <Text style={styles.sheetItemLabel}>Open chat</Text>
            <Icon name="chevron-right" size={20} color={C.textMeta} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetItem} onPress={onDelete}>
            <View style={[styles.sheetIconWrap, { backgroundColor: 'rgba(224,82,82,0.14)' }]}>
              <Icon name="delete-outline" size={18} color={C.danger} />
            </View>
            <Text style={[styles.sheetItemLabel, { color: C.danger }]}>Delete conversation</Text>
            <Icon name="chevron-right" size={20} color={C.textMeta} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surfaceAlt,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.border,
    overflow: 'hidden',
  },
  sheetPreview: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    backgroundColor: C.surface, gap: 12,
  },
  sheetPreviewAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sheetPreviewInitial: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  sheetPreviewName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  sheetPreviewSub: { fontSize: 12, color: C.textMeta, marginTop: 1 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 14,
  },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sheetItemLabel: { flex: 1, fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  sheetCancel: {
    marginHorizontal: 20, marginTop: 6, paddingVertical: 14,
    backgroundColor: C.surface, borderRadius: 14, alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  sheetCancelText: { fontSize: 15, color: C.textSecondary, fontWeight: '600' },
});

export default ActionSheet;