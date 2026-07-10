// screens/ai/components/RentalList.js
import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RentalCard from './RentalCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const C = {
  accent: '#059669',
  textPrimary: '#1a1a1a',
  surface: '#ffffff',
};

const RentalList = ({ data, onViewDetails, onViewMore }) => {
  if (!data || !data.rentals || data.rentals.length === 0) {
    return null;
  }

  const itemsWithMore = [...data.rentals, { isViewMore: true }];

  return (
    <View style={styles.container}>
      <FlatList
        data={itemsWithMore}
        keyExtractor={(item, index) => item.isViewMore ? 'view-more-rental' : (item.id?.toString() || index.toString())}
        renderItem={({ item }) => {
          if (item.isViewMore) {
            return (
              <TouchableOpacity 
                style={styles.viewMoreCard} 
                onPress={() => {
                  if (onViewMore) {
                    onViewMore('rentals');
                  }
                }}
              >
                <Ionicons name="arrow-forward-circle" size={40} color={C.accent} />
                <Text style={styles.viewMoreText}>View All</Text>
                <Text style={styles.viewMoreSubtext}>See all {data.rentals.length} rentals</Text>
              </TouchableOpacity>
            );
          }
          return (
            <View style={styles.cardWrapper}>
              <RentalCard
                data={{ count: 1, rentals: [item] }}
                onViewDetails={onViewDetails}
              />
            </View>
          );
        }}
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
  viewMoreCard: {
    width: CARD_WIDTH * 0.6,
    backgroundColor: C.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textPrimary,
    marginTop: 8,
  },
  viewMoreSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});

export default React.memo(RentalList);