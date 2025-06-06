import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';

const API_URL = 'https://markethubbackend.onrender.com/api/products/approved'; // Replace with ngrok/public IP if testing on device

const SecondHandHome = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(API_URL);
        const json = await response.json();
        setProducts(json.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>Ksh {item.price}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.seller}>Seller: {item.sellerId.username}</Text>
        <Text style={styles.phone}>Phone: {item.sellerId.phone}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Second Hand Items</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default SecondHandHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5fff6',
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#228B22',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 3,
    flexDirection: 'row',
  },
  image: {
    width: 120,
    height: 120,
  },
  cardContent: {
    flex: 1,
    padding: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  price: {
    color: '#2e8b57',
    marginVertical: 4,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    color: '#333',
  },
  seller: {
    marginTop: 5,
    fontSize: 12,
    fontStyle: 'italic',
  },
  phone: {
    fontSize: 12,
    color: '#888',
  },
});
