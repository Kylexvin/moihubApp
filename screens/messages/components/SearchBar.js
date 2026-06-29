import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const C = {
  surface: '#0D2E24',
  border: '#1A3D2E',
  textPrimary: '#E8F5EE',
  textMeta: '#5A8570',
};

const SearchBar = ({ value, onChangeText, placeholder = 'Search conversations…' }) => {
  return (
    <View style={styles.searchBar}>
      <Icon name="search" size={18} color={C.textMeta} style={{ marginRight: 8 }} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={C.textMeta}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Icon name="clear" size={18} color={C.textMeta} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, marginHorizontal: 14, marginTop: 10, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.textPrimary },
});

export default SearchBar;