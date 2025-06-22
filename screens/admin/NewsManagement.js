// screens/admin/NewsManagement.js

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const NewsManagement = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>News Management</Text>
      <Text style={styles.description}>This is a placeholder for managing news articles.</Text>
      <Button 
        title="Go Back"
        onPress={() => navigation.goBack()}
        color="#50c878"
      />
    </View>
  );
};

export default NewsManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});
