// screens/ai/components/MarketplaceCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const C = {
  accent: '#059669',
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMeta: '#888888',
  border: '#e0e0e0',
  surface: '#ffffff',
  bg: '#f5f5f5',
  white: '#ffffff',
  gold: '#D4AF37',
  warning: '#FF9800',
  danger: '#f44336',
};

const MarketplaceCard = ({ data, onViewDetails, onCall }) => {
  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  const item = data.items[0];
  const type = data.type || 'selling';

  const handleWhatsApp = () => {
    const phone = type === 'selling' ? item.sellerWhatsApp : item.buyerWhatsApp;
    if (onCall && phone) {
      onCall(phone);
    }
  };

  const getConditionColor = (condition) => {
    switch(condition) {
      case 'New': return '#4CAF50';
      case 'Like New': return '#8BC34A';
      case 'Good': return '#FF9800';
      case 'Fair': return '#FF5722';
      case 'Poor': return '#f44336';
      default: return C.textMeta;
    }
  };

  return (
    <View style={styles.container}>
      {/* Image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
        </View>
      )}

      {/* Badge - Selling or Wanted */}
      <View style={[styles.typeBadge, { backgroundColor: type === 'selling' ? C.accent : C.warning }]}>
        <Text style={styles.typeText}>{type === 'selling' ? 'For Sale' : 'Wanted'}</Text>
      </View>

      {/* Condition Badge */}
      {type === 'selling' && item.condition && (
        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(item.condition) }]}>
          <Text style={styles.conditionText}>{item.condition}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {type === 'selling' ? item.name : item.title}
        </Text>

        <Text style={styles.price}>
          {type === 'selling' ? `KSh ${item.price}` : `Budget: KSh ${item.maxBudget || 'N/A'}`}
        </Text>

        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}

        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={C.textMeta} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}

        {type === 'wanted' && item.urgency && (
          <View style={styles.urgencyRow}>
            <Ionicons name="time-outline" size={12} color={C.textMeta} />
            <Text style={styles.urgencyText}>Urgency: {item.urgency}</Text>
          </View>
        )}

        {type === 'selling' && item.isNegotiable && (
          <Text style={styles.negotiableText}>💰 Negotiable</Text>
        )}

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* ─── Single CTA: WhatsApp ────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={styles.whatsappButtonText}>
            {type === 'selling' ? 'Chat Seller on WhatsApp' : 'Chat Buyer on WhatsApp'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: C.surface,
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
    height: 150,
    backgroundColor: C.bg,
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.white,
  },
  conditionBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.white,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: C.accent,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: C.textMeta,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: C.textMeta,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  urgencyText: {
    fontSize: 12,
    color: C.textMeta,
  },
  negotiableText: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 10,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  whatsappButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default React.memo(MarketplaceCard);