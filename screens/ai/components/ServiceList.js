// screens/ai/components/ServiceList.js
import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import ServiceCard from './ServiceCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const ServiceList = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.providers || data.providers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data.providers}
        keyExtractor={(item) => item.id?.toString() || item.name}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ServiceCard
              data={{ count: 1, providers: [item] }}
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

export default React.memo(ServiceList);