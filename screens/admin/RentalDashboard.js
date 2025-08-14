import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
;

const { width } = Dimensions.get('window');

const RentalDashboard = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('management');
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);

  // Fetch inquiries
  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/rentals/inquiries', {
        params: {
          search: searchQuery,
          sortBy,
          order: sortOrder,
        },
      });

      if (response.data.success) {
        setInquiries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      Alert.alert('Error', 'Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, sortOrder]);

  // Refresh inquiries
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInquiries();
    setRefreshing(false);
  }, [fetchInquiries]);

  // Load inquiries when component mounts or comes into focus
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'inquiries') {
        fetchInquiries();
      }
    }, [activeTab, fetchInquiries])
  );

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'inquiries') {
        fetchInquiries();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, fetchInquiries]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };


const handleWhatsAppContact = async (phoneNumber, userName, propertyName) => {
  try {
    const message = `Hello ${userName}, I'm responding to your inquiry about ${propertyName}. How can I help you?`;

    // Clean and format number to Kenyan international format
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('254')
      ? cleanNumber
      : `254${cleanNumber.replace(/^0/, '')}`;

    const encodedMessage = encodeURIComponent(message);

    const whatsappInstalled = await Linking.canOpenURL('whatsapp://');

    if (whatsappInstalled) {
      try {
        await Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`);
        return;
      } catch (err) {
        console.warn('WhatsApp deep link failed:', err);
      }
    }

    // Fallback to HTTPS
    try {
      await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
      return;
    } catch (err) {
      console.warn('WhatsApp web fallback failed:', err);
    }

    // Final fallback – show options to user
    Alert.alert(
      'WhatsApp Not Available',
      'WhatsApp is not available on this device. Choose an option:',
      [
        {
          text: 'Copy Number',
          onPress: async () => {
            try {
              await Clipboard.setStringAsync(formattedNumber);
              Alert.alert('Copied!', `${formattedNumber} copied to clipboard`);
            } catch (copyErr) {
              console.error('Copy failed:', copyErr);
              Alert.alert('Error', 'Failed to copy number.');
            }
          }
        },
        {
          text: 'Open in Browser',
          onPress: async () => {
            try {
              await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
            } catch (browserErr) {
              console.error('Browser open failed:', browserErr);
              Alert.alert('Error', 'Failed to open in browser.');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );

  } catch (error) {
    console.error('Error opening WhatsApp contact:', error);
    Alert.alert('Error', 'Could not initiate WhatsApp contact.');
  }
};

  // Handle phone call
  const handlePhoneCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  // Render inquiry item
  const renderInquiryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.inquiryCard}
      onPress={() => {
        setSelectedInquiry(item);
        setInquiryModalVisible(true);
      }}
    >
      <View style={styles.inquiryHeader}>
        <Text style={styles.inquiryUserName}>{item.userName}</Text>
        <Text style={styles.inquiryDate}>{formatDate(item.createdAt)}</Text>
      </View>
      
      <Text style={styles.inquiryProperty}>{item.propertyName}</Text>
      <Text style={styles.inquiryLocation}>{item.propertyLocation}</Text>
      
      <View style={styles.inquiryActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleWhatsAppContact(item.userWhatsApp, item.userName, item.propertyName)}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          <Text style={styles.actionButtonText}>WhatsApp</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handlePhoneCall(item.userWhatsApp)}
        >
          <Ionicons name="call" size={16} color="#007AFF" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render management tab
  const renderManagementTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('RentalsManagement')}
          >
            <Ionicons name="home" size={30} color="#3B82F6" />
            <Text style={styles.quickActionTitle}>Rentals Management</Text>
            <Text style={styles.quickActionSubtitle}>View & manage all rentals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('RentalCreation')}
          >
            <Ionicons name="add-circle" size={30} color="#10B981" />
            <Text style={styles.quickActionTitle}>Create Rental</Text>
            <Text style={styles.quickActionSubtitle}>Add new rental property</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('RentalEdit')}
          >
            <Ionicons name="create" size={30} color="#F59E0B" />
            <Text style={styles.quickActionTitle}>Edit Rentals</Text>
            <Text style={styles.quickActionSubtitle}>Modify existing rentals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('inquiries')}
          >
            <Ionicons name="mail" size={30} color="#EF4444" />
            <Text style={styles.quickActionTitle}>Inquiries</Text>
            <Text style={styles.quickActionSubtitle}>View customer inquiries</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>No recent activity</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render inquiries tab
  const renderInquiriesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.inquiriesHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inquiries..." placeholderTextColor="#15b3cfff"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
        >
          <Ionicons 
            name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"} 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.inquiriesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
        ) : inquiries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={50} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No inquiries found</Text>
          </View>
        ) : (
          inquiries.map((item) => (
            <View key={item._id}>
              {renderInquiryItem({ item })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'management' && styles.activeTab]}
          onPress={() => setActiveTab('management')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'management' && styles.activeTabText]}>
            Management
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'inquiries' && styles.activeTab]}
          onPress={() => setActiveTab('inquiries')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'inquiries' && styles.activeTabText]}>
            Inquiries
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'management' ? renderManagementTab() : renderInquiriesTab()}

      {/* Inquiry Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inquiryModalVisible}
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Inquiry Details</Text>
              <TouchableOpacity
                onPress={() => setInquiryModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedInquiry && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Customer Name</Text>
                  <Text style={styles.modalValue}>{selectedInquiry.userName}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>WhatsApp</Text>
                  <Text style={styles.modalValue}>{selectedInquiry.userWhatsApp}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Property</Text>
                  <Text style={styles.modalValue}>{selectedInquiry.propertyName}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Location</Text>
                  <Text style={styles.modalValue}>{selectedInquiry.propertyLocation}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedInquiry.createdAt)}</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.whatsappButton]}
                    onPress={() => {
                      handleWhatsAppContact(
                        selectedInquiry.userWhatsApp,
                        selectedInquiry.userName,
                        selectedInquiry.propertyName
                      );
                      setInquiryModalVisible(false);
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="white" />
                    <Text style={styles.modalActionButtonText}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.callButton]}
                    onPress={() => {
                      handlePhoneCall(selectedInquiry.userWhatsApp);
                      setInquiryModalVisible(false);
                    }}
                  >
                    <Ionicons name="call" size={20} color="white" />
                    <Text style={styles.modalActionButtonText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Action Button for Create Rental */}
      {activeTab === 'management' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('RentalCreation')}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 10,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  inquiriesHeader: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  sortButton: {
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  inquiriesList: {
    flex: 1,
  },
  inquiryCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inquiryUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inquiryDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  inquiryProperty: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginBottom: 5,
  },
  inquiryLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  inquiryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    marginLeft: 5,
    color: '#374151',
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 5,
  },
  modalValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  callButton: {
    backgroundColor: '#007AFF',
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default RentalDashboard;