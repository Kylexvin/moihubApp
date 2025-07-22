import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const ManageProductScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('api/marketplace/seller');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Fetch products error:', err);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const handleDelete = async (id) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await axios.delete(`api/marketplace/delete/${id}`);
            setProducts((prev) => prev.filter((p) => p._id !== id));
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete product');
          }
        }
      }
    ]);
  };

  const handleMarkAsSold = async (id) => {
    Alert.alert('Mark as Sold', 'This will remove the product.', [
      { text: 'Cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await axios.put(`api/marketplace/sold/${id}`);
            setProducts((prev) => prev.filter((p) => p._id !== id));
          } catch (err) {
            console.error('Mark as sold error:', err);
            Alert.alert('Error', 'Failed to mark as sold');
          }
        }
      }
    ]);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.status}>Status: {item.approvalStatus?.toUpperCase()}</Text>
      <Text style={styles.price}>Ksh {item.price?.toLocaleString()}</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleMarkAsSold(item._id)}>
          <Text style={styles.sold}>Mark as Sold</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Text style={styles.delete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        contentContainerStyle={{ padding: 16 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateProduct')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ManageProductScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { padding: 16, backgroundColor: '#f8f8f8', borderRadius: 8, marginBottom: 16 },
  productName: { fontSize: 18, fontWeight: 'bold' },
  status: { color: '#4b0082', marginVertical: 4 },
  price: { fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  sold: { color: 'green' },
  delete: { color: 'red' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#4b0082',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
});
