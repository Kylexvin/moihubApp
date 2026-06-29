import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

const C = {
  bg: '#07201A',
  own: '#1B5E3B',
  border: '#1A3D2E',
  textPrimary: '#E8F5EE',
  textMeta: '#5A8570',
  blue: '#4FC3F7',
};

const TABS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'linkme', label: 'LinkMe', icon: '💘' },
  { key: 'system', label: 'System', icon: 'notifications' },
];

const ChatTabs = ({ activeTab, onTabChange, counts }) => {
  return (
    <View style={styles.tabsRow}>
      <View style={styles.tabsContainer}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const count = counts[tab.key] || 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onTabChange(tab.key);
              }}
            >
              <View style={styles.tabInner}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.icon === 'notifications'
                  ? <Icon name="notifications" size={13} color={active ? C.blue : C.textMeta} style={{ marginLeft: 4 }} />
                  : tab.icon
                    ? <Text style={{ fontSize: 13, marginLeft: 4 }}>{tab.icon}</Text>
                    : null
                }
                {count > 0 && (
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text style={styles.tabCountText}>{count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsRow: {
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    paddingVertical: 6, backgroundColor: C.bg,
  },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20 },
  tabActive: { backgroundColor: C.own },
  tabInner: { flexDirection: 'row', alignItems: 'center' },
  tabLabel: { fontSize: 13, fontWeight: '500', color: C.textMeta },
  tabLabelActive: { color: C.textPrimary, fontWeight: '700' },
  tabCount: { marginLeft: 5, backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabCountActive: { backgroundColor: 'rgb(7, 0, 0)' },
  tabCountText: { fontSize: 10, color: C.textMeta, fontWeight: '600' },
});

export default ChatTabs;