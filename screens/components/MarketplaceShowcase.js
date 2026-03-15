import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  Linking 
} from 'react-native';
import ShowcaseCarousel from './ShowcaseCarousel';
import { Ionicons } from '@expo/vector-icons';

const MarketplaceShowcase = ({ items, loading, navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleItemPress(item)}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons 
            name={item.type === 'product' ? 'cart' : 'search'} 
            size={24} 
            color="#999" 
          />
        </View>
      )}
      
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>
          {item.displayTitle}
        </Text>
        <Text style={styles.price}>
          {item.displayPrice}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {item.category}
        </Text>
        
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text style={styles.location} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={() => handleWhatsApp(item)}
        >
          <Text style={styles.whatsappButtonText}>
            {item.type === 'product' ? '💬 Contact Seller' : '💬 Contact Buyer'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleItemPress = (item) => {
    if (item.type === 'product') {
      navigation.navigate('ProductDetails', { productId: item._id });
    } else {
      navigation.navigate('WantedDetails', { wantedId: item._id });
    }
  };

  const handleWhatsApp = (item) => {
    const phone = item.type === 'product' ? item.sellerWhatsApp : item.buyerWhatsApp;
    if (phone) {
      const message = item.type === 'product' 
        ? `Hello! I'm interested in your product: ${item.displayTitle}`
        : `Hello! I might have what you're looking for: ${item.displayTitle}`;
      
      Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
    }
  };

  return (
    <ShowcaseCarousel
      title="Featured Marketplace Items"
      items={items}
      loading={loading}
      emptyMessage="No marketplace items available yet"
      renderItem={renderItem}
      type="marketplace"
    />
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#01604c',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default MarketplaceShowcase;
