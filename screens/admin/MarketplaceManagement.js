import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

const MarketplaceManagement = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch marketplace stats
  const fetchStats = async () => {
    try {
      const response = await axios.get('api/marketplace-admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      Alert.alert('Error', 'Failed to fetch marketplace statistics');
    }
  };

  // Fetch products by status
  const fetchProducts = async (status = selectedStatus) => {
    try {
      const response = await axios.get(`api/marketplace-admin/${status}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', `Failed to fetch ${status} products`);
    }
  };

  // Update product approval status
  const updateProductStatus = async (productId, newStatus) => {
    setActionLoading(true);
    try {
      await axios.put(`api/marketplace-admin/${productId}/status`, {
        approvalStatus: newStatus,
      });
      
      Alert.alert('Success', `Product ${newStatus} successfully`);
      await Promise.all([fetchStats(), fetchProducts()]);
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Error', `Failed to ${newStatus} product`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete product by admin
  const deleteProduct = async (productId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await axios.delete(`api/marketplace-admin/${productId}`);
              Alert.alert('Success', 'Product deleted successfully');
              await Promise.all([fetchStats(), fetchProducts()]);
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Delete all rejected products
  const deleteAllRejected = async () => {
    if (stats?.products?.rejected === 0) {
      Alert.alert('Info', 'No rejected products to delete');
      return;
    }

    Alert.alert(
      'Confirm Bulk Delete',
      `Delete all ${stats?.products?.rejected} rejected products?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await axios.delete('api/marketplace-admin/rejected/delete');
              Alert.alert('Success', response.data.message);
              await Promise.all([fetchStats(), fetchProducts()]);
            } catch (error) {
              console.error('Error deleting rejected products:', error);
              Alert.alert('Error', 'Failed to delete rejected products');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle tab change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    fetchProducts(status);
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchProducts()]);
    setRefreshing(false);
  }, [selectedStatus]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Stats card component
  const StatsCard = ({ title, value, color }) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  // Product item component
  const ProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title || item.name || 'Untitled Product'}
        </Text>
        <View style={[styles.statusBadge, styles[`${item.approvalStatus}Badge`]]}>
          <Text style={styles.statusText}>{item.approvalStatus.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.productDescription} numberOfLines={3}>
        {item.description || 'No description available'}
      </Text>
      
      <View style={styles.productMeta}>
        <Text style={styles.metaText}>
          Price: ${item.price || 'N/A'} | Category: {item.category || 'N/A'}
        </Text>
        <Text style={styles.metaText}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        {item.approvalStatus === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => updateProductStatus(item._id, 'approved')}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => updateProductStatus(item._id, 'rejected')}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
        
        {item.approvalStatus === 'approved' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => updateProductStatus(item._id, 'rejected')}
            disabled={actionLoading}
          >
            <Text style={styles.actionBtnText}>Revoke</Text>
          </TouchableOpacity>
        )}
        
        {item.approvalStatus === 'rejected' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => updateProductStatus(item._id, 'approved')}
            disabled={actionLoading}
          >
            <Text style={styles.actionBtnText}>Restore</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => deleteProduct(item._id)}
          disabled={actionLoading}
        >
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading marketplace data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Marketplace Management</Text>
          <Text style={styles.headerSubtitle}>Admin Dashboard</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Product Statistics</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Total Products"
              value={stats?.products?.total || 0}
              color="#10b981"
            />
            <StatsCard
              title="Pending"
              value={stats?.products?.pending || 0}
              color="#f59e0b"
            />
            <StatsCard
              title="Approved"
              value={stats?.products?.approved || 0}
              color="#059669"
            />
            <StatsCard
              title="Rejected"
              value={stats?.products?.rejected || 0}
              color="#dc2626"
            />
          </View>

          <Text style={styles.sectionTitle}>Wanted Posts Statistics</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Total Wanted"
              value={stats?.wantedPosts?.total || 0}
              color="#10b981"
            />
            <StatsCard
              title="Active"
              value={stats?.wantedPosts?.active || 0}
              color="#059669"
            />
            <StatsCard
              title="Fulfilled"
              value={stats?.wantedPosts?.fulfilled || 0}
              color="#0891b2"
            />
            <StatsCard
              title="Expired"
              value={stats?.wantedPosts?.expired || 0}
              color="#6b7280"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.bulkActionBtn, styles.deleteBulkBtn]}
            onPress={deleteAllRejected}
            disabled={actionLoading || (stats?.products?.rejected || 0) === 0}
          >
            <Text style={styles.bulkActionText}>
              Delete All Rejected ({stats?.products?.rejected || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Tabs */}
        <View style={styles.tabsContainer}>
          {['pending', 'approved', 'rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.tab,
                selectedStatus === status && styles.activeTab,
              ]}
              onPress={() => handleStatusChange(status)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedStatus === status && styles.activeTabText,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({stats?.products?.[status] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Products List */}
        <View style={styles.productsSection}>
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {selectedStatus} products found
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              renderItem={ProductItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#064e3b',
    borderBottomWidth: 1,
    borderBottomColor: '#10b981',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ecfdf5',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a7f3d0',
    opacity: 0.8,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 15,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ecfdf5',
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 14,
    color: '#a7f3d0',
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bulkActionBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteBulkBtn: {
    backgroundColor: '#7f1d1d',
  },
  bulkActionText: {
    color: '#fecaca',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#10b981',
  },
  tabText: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#064e3b',
  },
  productsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  productCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#ecfdf5',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: '#fbbf24',
  },
  approvedBadge: {
    backgroundColor: '#10b981',
  },
  rejectedBadge: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  productDescription: {
    color: '#a7f3d0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  productMeta: {
    marginBottom: 16,
  },
  metaText: {
    color: '#6ee7b7',
    fontSize: 12,
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#059669',
  },
  rejectBtn: {
    backgroundColor: '#dc2626',
  },
  deleteBtn: {
    backgroundColor: '#7f1d1d',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6ee7b7',
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default MarketplaceManagement;