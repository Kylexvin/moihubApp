import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EditListingScreen = ({ route }) => {
  const { listing } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit Listing: {listing?.name}</Text>
      {/* TODO: Implement form pre-filled with listing data */}
    </View>
  );
};

export default EditListingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 }
});
