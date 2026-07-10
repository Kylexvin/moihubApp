// screens/eshop/EshopAIScreen.js
import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AIModuleChat from '../ai/components/AIModuleChat';

const EshopAIScreen = () => {
  const navigation = useNavigation();

  const handleViewDetails = (item, type) => {
    if (type === 'eshop') {
      navigation.navigate('ShopProducts', {
        shopSlug: item.slug,
        shopName: item.shopName,
        shopId: item.id,
      });
    }
    if (type === 'product') {
      navigation.navigate('ProductDetail', {
        productId: item.id,
        shopId: item.shop?.id,
      });
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleViewMore = () => {
    navigation.navigate('EshopHome');
  };

  return (
    <AIModuleChat
      module="eshops"
      placeholder="Search products or shops..."
      navigation={navigation}
      onViewDetails={handleViewDetails}
      onCall={handleCall}
      onViewMore={handleViewMore}
      initialMessage="👋 Welcome to Eshop Assistant! I can help you find Products in eshops. What are you looking for?"
    />
  );
};

export default EshopAIScreen;