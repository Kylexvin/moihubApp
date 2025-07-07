import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ListingDetailsScreen = ({ route }) => {
  const { listing } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Listing Details for: {listing?.name}</Text>
      {/* TODO: Display full listing info including images, price, etc. */}
    </View>
  );
};

export default ListingDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 }
});
