import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import RentalCard from './RentalCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75; // 75% of screen width

const RentalList = ({ data, onViewDetails }) => {
  if (!data || !data.rentals || data.rentals.length === 0) {
    return null;
  }

  const renderItem = ({ item }) => {
    const singleRentalData = {
      count: 1,
      rentals: [item]
    };
    return (
      <View style={styles.cardWrapper}>
        <RentalCard 
          data={singleRentalData} 
          onViewDetails={onViewDetails}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data.rentals}
        keyExtractor={(item) => item.id || item.name}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        pagingEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginLeft: -8, // Align with message bubble
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
});

export default RentalList;