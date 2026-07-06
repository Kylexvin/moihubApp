import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const RentalCard = ({ data, onViewDetails }) => {
  if (!data || !data.rentals || data.rentals.length === 0) {
    return null;
  }

  const rental = data.rentals[0];

  const getStatusColor = () => {
    if (rental.hasVacant === true) return '#4CAF50';
    if (rental.hasVacant === false) return '#f44336';
    return '#FF9800';
  };

  const getStatusText = () => {
    if (rental.hasVacant === true) return 'Available';
    if (rental.hasVacant === false) return 'Occupied';
    return 'Unknown';
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(rental);
    }
  };

  const handleOpenMap = () => {
    if (rental.locationUrl) {
      Linking.openURL(rental.locationUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image */}
      {rental.imageUrl ? (
        <Image 
          source={{ uri: rental.imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="home-outline" size={40} color="#ccc" />
        </View>
      )}

      {/* Status Badge Overlay */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {rental.name}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{rental.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{rental.type}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.detailText}>KSh {rental.price}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleViewDetails}
          >
            <Ionicons name="eye-outline" size={16} color="#fff" />
            <Text style={styles.primaryActionText}>View Details</Text>
          </TouchableOpacity>
          
          {rental.locationUrl && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleOpenMap}
            >
              <Ionicons name="map-outline" size={16} color="#2C3E50" />
              <Text style={styles.secondaryActionText}>Map</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  details: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  primaryAction: {
    backgroundColor: '#2C3E50',
    flex: 1,
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  secondaryAction: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 0.6,
  },
  secondaryActionText: {
    color: '#2C3E50',
    fontSize: 13,
    marginLeft: 4,
  },
});

export default RentalCard;