import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const C = {
  accent: '#34C97A',
  danger: '#E05252',
};

const ConnectionStatus = ({ status }) => {
  const isConnected = status === 'connected';
  return (
    <View style={[styles.connPill, isConnected && styles.connPillOnline]}>
      <View style={[styles.connDot, isConnected && styles.connDotOnline]} />
      <Text style={[styles.connText, isConnected && styles.connTextOnline]}>
        {isConnected ? 'Online' : 'Offline'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  connPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(224,82,82,0.15)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(224,82,82,0.3)',
  },
  connPillOnline: { backgroundColor: 'rgba(52,201,122,0.12)', borderColor: 'rgba(52,201,122,0.3)' },
  connDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.danger, marginRight: 5 },
  connDotOnline: { backgroundColor: C.accent },
  connText: { fontSize: 11, color: C.danger, fontWeight: '600' },
  connTextOnline: { color: C.accent },
});

export default ConnectionStatus;