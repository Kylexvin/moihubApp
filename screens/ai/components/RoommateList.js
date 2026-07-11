// screens/ai/components/RoommateList.js
import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RoommateCard from './RoommateCard';

const { width } = Dimensions.get('window');

const RoommateList = ({ data, onViewDetails, onCall }) => {
  const roommates = data.roommates || [];

  if (roommates.length === 0) return null;

  // Calculate card width to fit screen with proper padding
  const cardWidth = width * 0.85; // 85% of screen width

  const renderItem = ({ item }) => (
    <View style={[styles.cardWrapper, { width: cardWidth }]}>
      <RoommateCard 
        data={{ roommates: [item] }} 
        onViewDetails={onViewDetails} 
        onCall={onCall}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={22} color="#E6B89C" />
          <Text style={styles.title}>Roommate Listings</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.count}>{roommates.length}</Text>
        </View>
      </View>

      <FlatList
        data={roommates}
        keyExtractor={(item) => item.id || item._id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={cardWidth + 12} // Card width + margin
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#E6B89C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  count: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cardWrapper: {
    marginRight: 12,
  },
});

export default RoommateList;