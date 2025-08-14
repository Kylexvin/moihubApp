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
  Image,
  Linking,
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

const MarketplaceManagement = ({ startConversation, navigation, handleAuthError }) => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Handle chat start utility
  const handleStartChat = async (product, chatType = 'normal') => {
    // Extract seller info from product
    const seller = product.seller || product.sellerId;
    const sellerId = seller?._id || product.seller?._id || product.sellerId?._id || product.sellerId;
    
    console.log('Product seller info:', {
      seller,
      sellerId,
      productSeller: product.seller,
      productSellerId: product.sellerId
    });

    if (!sellerId) {
      Alert.alert('Error', 'Seller information not available');
      return;
    }

    // Create user object for chat
    const userForChat = {
      _id: sellerId,
      username: seller?.username || product.seller?.username || product.sellerId?.username,
      name: seller?.name || product.seller?.name || product.sellerId?.name,
      // Add any other user fields your chat system needs
    };

    try {
      const { data } = await axios.post('api/messages/conversations', {
        participantId: sellerId,
        chatType
      });

      navigation.navigate('MessageStackNavigator', {
        screen: 'ChatScreen',
        params: {
          conversationId: data._id,
          conversation: data,
          otherUser: userForChat,
          chatType: data.chatType || chatType
        }
      });

    } catch (err) {
      if (err.response?.status === 401) {
        handleAuthError();
      } else {
        console.error('Conversation error:', err);
        Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation');
      }
    }
  };

  // Handle WhatsApp contact
  const handleWhatsAppContact = (whatsappNumber, productTitle) => {
    if (!whatsappNumber) {
      Alert.alert('Info', 'WhatsApp number not available for this seller');
      return;
    }
    
    const message = `Hi! I'm interested in your product: ${productTitle}`;
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    });
  };

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
      <View style={styles.productContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.title || item.name || 'Untitled Product'}
            </Text>
            <View style={[styles.statusBadge, styles[`${item.approvalStatus}Badge`]]}>
              <Text style={styles.statusText}>{item.approvalStatus.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
          
          <View style={styles.productMeta}>
            <Text style={styles.metaText}>
              Price: ${item.price || 'N/A'} | Category: {item.category || 'N/A'}
            </Text>
            <Text style={styles.metaText}>
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {(item.seller || item.sellerId) && (
              <Text style={styles.metaText}>
                Seller: {item.seller?.username || item.sellerId?.username || item.seller?.name || item.sellerId?.name || 'Unknown'}
              </Text>
            )}
          </View>

          {/* All Action Buttons (Admin + Contact) */}
          <View style={styles.allActionsContainer}>
            {/* Admin Actions */}
            <View style={styles.adminActions}>
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

            {/* Contact Options - Make them prominent */}
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Contact Seller:</Text>
              <View style={styles.contactActions}>
                {(item.seller || item.sellerId) && (
                  <TouchableOpacity
                    style={[styles.contactBtn, styles.chatBtn]}
                    onPress={() => handleStartChat(item, 'normal')}
                  >
                    <Text style={styles.contactBtnText}>💬 Internal Chat</Text>
                  </TouchableOpacity>
                )}
                
                {item.sellerWhatsApp && (
                  <TouchableOpacity
                    style={[styles.contactBtn, styles.whatsappBtn]}
                    onPress={() => handleWhatsAppContact(item.sellerWhatsApp, item.title)}
                  >
                    <Text style={styles.contactBtnText}>📱 WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: (width - 50) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  statsTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bulkActionBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  deleteBulkBtn: {
    backgroundColor: '#dc2626',
  },
  bulkActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  productsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productContent: {
    flexDirection: 'row',
    padding: 15,
  },
  imageContainer: {
    marginRight: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  approvedBadge: {
    backgroundColor: '#d1fae5',
  },
  rejectedBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1f2937',
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  productMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  contactSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  adminActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
  },
  chatBtn: {
    backgroundColor: '#3b82f6',
  },
  whatsappBtn: {
    backgroundColor: '#25d366',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default MarketplaceManagement;