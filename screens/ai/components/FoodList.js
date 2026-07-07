// screens/ai/components/FoodList.js
import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import FoodCard from './FoodCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const FoodList = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.foodVendors || data.foodVendors.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data.foodVendors}
        keyExtractor={(item) => item.id?.toString() || item.shopName}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <FoodCard
              data={{ count: 1, foodVendors: [item] }}
              onViewDetails={onViewDetails}
              onCall={onCall}
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

export default FoodList;