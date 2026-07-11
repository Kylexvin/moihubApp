// screens/ai/components/RoommateCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RoommateCard = ({ data, onViewDetails, onCall }) => {
  const roommate = data.roommates?.[0];
  
  if (!roommate) return null;

  const getTypeLabel = (type) => {
    return type === 'has_room' ? 'Has Room' : 'Needs Room';
  };

  const getTypeIcon = (type) => {
    return type === 'has_room' ? 'home-outline' : 'person-add-outline';
  };

  const getGenderLabel = (gender) => {
    return gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other';
  };

  const getGenderIcon = (gender) => {
    return gender === 'male' ? 'male-outline' : gender === 'female' ? 'female-outline' : 'person-outline';
  };

  const handleWhatsApp = () => {
    const phoneNumber = roommate.whatsappNumber?.replace(/[^0-9]/g, '') || '';
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    const url = `whatsapp://send?phone=${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const phoneUrl = `tel:${phoneNumber}`;
          return Linking.openURL(phoneUrl);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp');
      });
  };

  const handleCall = () => {
    const phoneNumber = roommate.whatsappNumber?.replace(/[^0-9]/g, '') || '';
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to make call');
      });
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.nameSection}>
            <Text style={styles.name} numberOfLines={1}>{roommate.name}</Text>
            <View style={styles.genderChip}>
              <Ionicons name={getGenderIcon(roommate.gender)} size={12} color="#b0a0a8" />
              <Text style={styles.genderText}>{getGenderLabel(roommate.gender)}</Text>
            </View>
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.typeBadge, roommate.type === 'has_room' ? styles.hasRoomBadge : styles.needsRoomBadge]}>
              <Ionicons name={getTypeIcon(roommate.type)} size={10} color="#fff" />
              <Text style={styles.typeBadgeText}>{getTypeLabel(roommate.type)}</Text>
            </View>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#E6B89C" />
            <Text style={styles.detailText} numberOfLines={1}>{roommate.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={14} color="#E6B89C" />
            <Text style={styles.detailText}>
              {roommate.budget ? `KSh ${roommate.budget.toLocaleString()}` : 'Flexible'}
            </Text>
          </View>
          {roommate.preferredGender && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={14} color="#E6B89C" />
              <Text style={styles.detailText}>Prefers: {getGenderLabel(roommate.preferredGender)}</Text>
            </View>
          )}
        </View>

        {/* Description - only show if short */}
        {roommate.description && roommate.description.length < 60 && (
          <Text style={styles.description} numberOfLines={1}>
            {roommate.description}
          </Text>
        )}

        {/* Card Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
            <Ionicons name="call-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    padding: 14,
    backgroundColor: '#2a1f24',
  },
  cardHeader: {
    marginBottom: 10,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
    gap: 3,
  },
  genderText: {
    fontSize: 11,
    color: '#b0a0a8',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    gap: 3,
  },
  hasRoomBadge: {
    backgroundColor: 'rgba(74, 44, 61, 0.8)',
    borderWidth: 1,
    borderColor: '#E6B89C',
  },
  needsRoomBadge: {
    backgroundColor: 'rgba(107, 78, 94, 0.8)',
    borderWidth: 1,
    borderColor: '#8B6B7B',
  },
  typeBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 8,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#b0a0a8',
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  callButton: {
    backgroundColor: '#6C63FF',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default RoommateCard;