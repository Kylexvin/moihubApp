// screens/ai/components/FoodList.js
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
import FoodCard from './FoodCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20px padding on each side

const C = {
  primary: '#FF6B35',
  textPrimary: '#1a1a1a',
  surface: '#ffffff',
};

const FoodList = ({ data, onViewDetails, onCall, onViewMore }) => {
  if (!data || !data.foodVendors || data.foodVendors.length === 0) {
    return null;
  }

  const itemsWithMore = [...data.foodVendors, { isViewMore: true }];

  return (
    <View style={styles.container}>
      <FlatList
        data={itemsWithMore}
        keyExtractor={(item, index) => item.isViewMore ? 'view-more-food' : (item.id?.toString() || index.toString())}
        renderItem={({ item }) => {
          if (item.isViewMore) {
            return (
              <TouchableOpacity 
                style={[styles.viewMoreCard, { width: CARD_WIDTH * 0.6 }]} 
                onPress={() => {
                  if (onViewMore) {
                    onViewMore('food');
                  }
                }}
              >
                <Ionicons name="arrow-forward-circle" size={40} color={C.primary} />
                <Text style={styles.viewMoreText}>View All</Text>
                <Text style={styles.viewMoreSubtext}>See all {data.foodVendors.length} vendors</Text>
              </TouchableOpacity>
            );
          }
          return (
            <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
              <FoodCard
                data={{ count: 1, foodVendors: [item] }}
                onViewDetails={onViewDetails}
                onCall={onCall}
              />
            </View>
          );
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  cardWrapper: {
    marginRight: 12,
  },
  viewMoreCard: {
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

export default React.memo(FoodList);