import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const C = {
  system: '#2563EB',
  linkme: '#C026D3',
  accent: '#34C97A',
  white: '#FFFFFF',
  bg: '#07201A',
  surface: '#0D2E24',
};

const avatarPalette = ['#1B6B45','#2D5A8E','#7B3FA0','#B05A1A','#2E7D6B','#6B3A1B','#1B4A6B'];

const getAvatarColor = (username) => {
  if (!username) return avatarPalette[0];
  return avatarPalette[username.charCodeAt(0) % avatarPalette.length];
};

const getInitial = (username) => (username || '?')[0].toUpperCase();

const ConversationAvatar = React.memo(({ user, isSystem, isLinkMe, isOnline, size = 48 }) => {
  const bg = isSystem ? '#0D1B3E' : getAvatarColor(user?.username);
  
  return (
    <View style={styles.avatarWrap}>
      <View style={[
        styles.avatarCircle,
        { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 },
        isSystem && styles.avatarSystem,
        isLinkMe && styles.avatarLinkMe,
      ]}>
        {isSystem
          ? <Icon name="notifications" size={size * 0.45} color={C.system} />
          : <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>
              {getInitial(user?.username)}
            </Text>
        }
        {isLinkMe && (
          <View style={styles.linkMeBadge}>
            <Text style={styles.linkMeBadgeText}>💘</Text>
          </View>
        )}
      </View>
      {!isSystem && isOnline && <View style={styles.onlineDot} />}
    </View>
  );
});

const styles = StyleSheet.create({
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatarCircle: { justifyContent: 'center', alignItems: 'center' },
  avatarSystem: { borderWidth: 1.5, borderColor: C.system },
  avatarLinkMe: { borderWidth: 1.5, borderColor: C.linkme },
  avatarInitial: { color: C.white, fontWeight: '700' },
  linkMeBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: C.bg, borderRadius: 9,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  linkMeBadgeText: { fontSize: 11 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: C.accent, borderWidth: 2, borderColor: C.surface,
  },
});

export default ConversationAvatar;