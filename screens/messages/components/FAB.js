import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

const C = {
  accent: '#34C97A',
  white: '#FFFFFF',
};

const FAB = ({ onPress, position = { right: 20, bottom: 24 } }) => {
  return (
    <TouchableOpacity
      style={[styles.fab, position]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.85}
    >
      <Icon name="edit" size={22} color={C.white} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6,
  },
});

export default FAB;