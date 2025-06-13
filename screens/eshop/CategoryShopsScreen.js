// screens/eshop/CategoryShopsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CategoryShopsScreen = ({ route, navigation }) => {
  const { categoryName, categorySlug } = route.params;

  const dummyShops = [
    { id: '1', name: 'Fashion Hub', status: 'Open', rating: 4.5 },
    { id: '2', name: 'Style Central', status: 'Closed', rating: 4.2 },
    { id: '3', name: 'Trendy Boutique', status: 'Open', rating: 4.8 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.categoryText}>Category: {categoryName}</Text>
        <Text style={styles.slugText}>Slug: {categorySlug}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>🏪 Available Shops</Text>
        
        {dummyShops.map((shop) => (
          <TouchableOpacity
            key={shop.id}
            style={styles.shopCard}
            onPress={() => navigation.navigate('ShopProducts', { 
              shopName: shop.name,
              shopId: shop.id 
            })}
          >
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={[
                styles.shopStatus,
                { color: shop.status === 'Open' ? '#10b981' : '#ef4444' }
              ]}>
                {shop.status}
              </Text>
              <Text style={styles.shopRating}>⭐ {shop.rating}</Text>
            </View>
            <Icon name="arrow-forward-ios" size={20} color="#64748b" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};






const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  slugText: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  shopCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  shopStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  shopRating: {
    fontSize: 14,
    color: '#64748b',
  },
  dummyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dummyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 10,
  },
  dummyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  dummyNote: {
    fontSize: 18,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
});

export default CategoryShopsScreen;