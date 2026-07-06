// screens/ai/components/RentalList.js
import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import RentalCard from './RentalCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const RentalList = ({ data, onViewDetails }) => {
  if (!data || !data.rentals || data.rentals.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data.rentals}
        keyExtractor={(item) => item.id?.toString() || item.name}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RentalCard
              data={{ count: 1, rentals: [item] }}
              onViewDetails={onViewDetails}
            />
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginLeft: -8,
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