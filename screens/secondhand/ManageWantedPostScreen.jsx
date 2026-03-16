import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet, 
  StatusBar,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Dark Warm Amber Theme (matching MarketplaceDashboard)
const MarketplaceColors = {
  primary: '#03604d',      
  primaryDark: '#0e582a',   // Dark Amber
  primaryLight: '#0b7a0b',  // Light Amber
  secondary: '#10B981',     // Teal (for success/balance)
  accent: '#8B5CF6',        // Purple (for highlights)
  background: '#0F0F0F',    // Near Black
  surface: '#1A1A1A',       // Dark Surface
  card: '#242424',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#9CA3AF', // Gray
  textMuted: '#6B7280',     // Dark Gray
  border: '#2D2D2D',        // Border
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const ManageWantedPostScreen = () => {
  const [wantedPosts, setWantedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchMyWantedPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('api/wanted/buyer/my-posts');
      setWantedPosts(data.posts || []);
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Failed to load your wanted posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMyWantedPosts();
    }, [fetchMyWantedPosts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyWantedPosts();
  }, [fetchMyWantedPosts]);

const deletePost = async (id) => {
  Alert.alert(
    'Delete Post',
    'Are you sure you want to delete this wanted post?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`api/wanted/delete/${id}`);
            setWantedPosts(prev => prev.filter(p => p._id !== id));
            Alert.alert('Success', 'Post deleted');
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete post');
          }
        }
      }
    ]
  );
};

const markFulfilled = async (id) => {
  Alert.alert(
    'Mark as Fulfilled',
    'Mark this item as fulfilled? It will be removed from listings.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            // Hitting the same delete endpoint
            await axios.delete(`api/wanted/delete/${id}`);
            setWantedPosts(prev => prev.filter(p => p._id !== id));
            Alert.alert('Success', 'Marked as fulfilled');
          } catch (err) {
            console.error('Fulfill error:', err);
            Alert.alert('Error', 'Failed to mark as fulfilled');
          }
        }
      }
    ]
  );
};

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent':
        return MarketplaceColors.error;
      case 'high':
        return MarketplaceColors.warning;
      case 'medium':
        return MarketplaceColors.accent;
      case 'low':
        return MarketplaceColors.success;
      default:
        return MarketplaceColors.textSecondary;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return MarketplaceColors.success;
      case 'fulfilled':
        return MarketplaceColors.primary;
      case 'expired':
        return MarketplaceColors.textMuted;
      default:
        return MarketplaceColors.textSecondary;
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <LinearGradient
        colors={[MarketplaceColors.card, MarketplaceColors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Header with Title and Urgency */}
        <View style={styles.cardHeader}>
          <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
          {item.urgency && (
            <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) + '20' }]}>
              <Text style={[styles.urgencyText, { color: getUrgencyColor(item.urgency) }]}>
                {item.urgency.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Budget */}
        <View style={styles.budgetContainer}>
          <Ionicons name="cash" size={16} color={MarketplaceColors.primary} />
          <Text style={styles.budgetText}>
            Ksh {item.maxBudget?.toLocaleString() || 'N/A'}
          </Text>
        </View>

        {/* Category & Condition */}
        {item.category && (
          <Text style={styles.categoryText}>
            📂 {item.category} • {item.preferredCondition || 'Any condition'}
          </Text>
        )}

        {/* Description */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons 
            name={item.status === 'fulfilled' ? 'checkmark-circle' : 'time'} 
            size={14} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status?.toUpperCase() || 'ACTIVE'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            onPress={() => markFulfilled(item._id)} 
            style={[styles.actionButton, styles.fulfillButton]}
          >
            <LinearGradient
              colors={[MarketplaceColors.success, MarketplaceColors.success + 'dd']}
              style={styles.actionGradient}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>Fulfilled</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => deletePost(item._id)} 
            style={[styles.actionButton, styles.deleteButton]}
          >
            <LinearGradient
              colors={[MarketplaceColors.error, MarketplaceColors.error + 'dd']}
              style={styles.actionGradient}
            >
              <Ionicons name="trash" size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>Delete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cart-outline" size={60} color={MarketplaceColors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Wanted Posts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first wanted post to let sellers know what you're looking for
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateWantedPost')}
      >
        <LinearGradient
          colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
          style={styles.emptyButtonGradient}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Create Wanted Post</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[MarketplaceColors.background, MarketplaceColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="cart" size={40} color={MarketplaceColors.primary} />
          </View>
          <ActivityIndicator size="large" color={MarketplaceColors.primary} />
          <Text style={styles.loadingText}>Loading your wanted posts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[MarketplaceColors.background, MarketplaceColors.surface]}
        style={StyleSheet.absoluteFill}
      />
      
      <StatusBar barStyle="light-content" backgroundColor={MarketplaceColors.primaryDark} />

      {/* Header */}
      <LinearGradient
        colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wanted Posts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateWantedPost')}>
            <Ionicons name="add-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {wantedPosts.length ? (
        <FlatList
          data={wantedPosts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MarketplaceColors.primary}
              colors={[MarketplaceColors.primary]}
            />
          }
        />
      ) : (
        renderEmptyComponent()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: MarketplaceColors.background 
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  postCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  postTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: MarketplaceColors.text,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  budgetText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: MarketplaceColors.primary 
  },
  categoryText: {
    fontSize: 12,
    color: MarketplaceColors.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: MarketplaceColors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  actionButton: { 
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  fulfillButton: {
    // Gradient handled inline
  },
  deleteButton: {
    // Gradient handled inline
  },
  actionText: { 
    color: '#FFFFFF', 
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MarketplaceColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: MarketplaceColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MarketplaceColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: MarketplaceColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: MarketplaceColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ManageWantedPostScreen;