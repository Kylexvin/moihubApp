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

const ServicesShowcase = ({ items, loading, navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: getCategoryColor(item.category) }
        ]}>
          <Text style={styles.categoryText}>
            {getCategoryIcon(item.category)} {item.category}
          </Text>
        </View>
        
        {item.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.title} numberOfLines={2}>
        {item.displayTitle}
      </Text>
      
      {item.displayLocation && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color="#666" />
          <Text style={styles.location} numberOfLines={1}>
            {item.displayLocation}
          </Text>
        </View>
      )}
      
      <View style={styles.phoneRow}>
        <Ionicons name="call-outline" size={12} color="#666" />
        <Text style={styles.phone} numberOfLines={1}>
          {formatPhone(item.phone)}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.ctaButton,
          item.providerType === 'dashboard' 
            ? styles.dashboardButton 
            : styles.callButton
        ]}
        onPress={() => handleCTAPress(item)}
      >
        <Text style={styles.ctaButtonText}>
          {item.cta} {item.providerType === 'dashboard' ? '→' : '📞'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const handleItemPress = (item) => {
    if (item.providerType === 'dashboard') {
      navigation.navigate('ServiceDashboard', { providerId: item._id });
    } else {
      Linking.openURL(`tel:${item.phone}`);
    }
  };

  const handleCTAPress = (item) => {
    if (item.providerType === 'dashboard') {
      navigation.navigate('ServiceDashboard', { providerId: item._id });
    } else {
      Linking.openURL(`tel:${item.phone}`);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Matatu services': '🚗',
      'Motorbike Services': '🏍️',
      'Best Kinyozi': '💈',
      'Saloonist': '💇',
      'Mama Fua': '👚',
      'Laundry Services': '🧺',
      'Electronic Repairs': '🔧',
      'Gas Deliveries Services': '🔥',
      'default': '🛠️'
    };
    return icons[category] || icons.default;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Matatu services': '#FF9800',
      'Motorbike Services': '#2196F3',
      'Best Kinyozi': '#9C27B0',
      'Saloonist': '#E91E63',
      'Mama Fua': '#4CAF50',
      'Laundry Services': '#00BCD4',
      'Electronic Repairs': '#795548',
      'Gas Deliveries Services': '#F44336',
      'default': '#607D8B'
    };
    return colors[category] || colors.default;
  };

  const formatPhone = (phone) => {
    if (!phone) return 'No phone';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  return (
    <ShowcaseCarousel
      title="Popular Local Services"
      items={items}
      loading={loading}
      emptyMessage="No services available yet"
      renderItem={renderItem}
      type="services"
    />
  );
};

const styles = StyleSheet.create({
  card: {
    width: 180,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  location: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phone: {
    fontSize: 11,
    color: '#01604c',
    fontWeight: 'bold',
    marginLeft: 4,
    flex: 1,
  },
  ctaButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dashboardButton: {
    backgroundColor: '#01604c',
  },
  callButton: {
    backgroundColor: '#25D366',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ServicesShowcase;