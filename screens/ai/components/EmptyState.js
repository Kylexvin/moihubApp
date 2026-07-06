import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptyState = ({ message }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={40} color="#ccc" />
      <Text style={styles.title}>No Results Found</Text>
      <Text style={styles.message}>
        {message || "Try adjusting your search criteria"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  message: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default EmptyState;