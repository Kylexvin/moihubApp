import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const C = {
  textSecondary: '#7CA98A',
  textMeta: '#5A8570',
};

const EmptyState = ({ tab }) => {
  const copy = {
    linkme: { title: 'No LinkMe chats', sub: 'Your matches will appear here' },
    system: { title: 'No system notifications', sub: 'System announcements will appear here' },
    all: { title: 'No conversations yet', sub: 'Tap + to start a new conversation' },
  };
  const { title, sub } = copy[tab] || copy.all;

  return (
    <View style={styles.emptyWrap}>
      {tab === 'system'
        ? <Icon name="notifications-none" size={60} color={C.textMeta} />
        : tab === 'linkme'
          ? <Text style={{ fontSize: 60 }}>💘</Text>
          : <Icon name="chat-bubble-outline" size={60} color={C.textMeta} />
      }
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: C.textSecondary, marginTop: 8 },
  emptySub: { fontSize: 14, color: C.textMeta, textAlign: 'center', lineHeight: 20 },
});

export default EmptyState;