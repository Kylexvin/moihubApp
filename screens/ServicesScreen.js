import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, 
  SafeAreaView, Dimensions, TextInput, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import WhatsAppFAB from './WhatsAppFAB';
import DataService from '../services/DataService';
import ServiceTrackingService from '../services/ServiceTrackingService';

const { width } = Dimensions.get('window');

const ServicesScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [reorderedServices, setReorderedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSmartSort, setShowSmartSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(null);

  const categories = ['All', 'uni', 'accom', 'food', 'shop', 'local'];

  // Original services array (this remains your default order)
  const originalServices = [
    { id: "uni", title: "My University", icon: "school", category: "uni", color: "#50c878" },
    { id: "rental", title: "Rental Booking", icon: "home", category: "accom", color: "#50c878"  },
    { id: "roommate", title: "Roommate Finder", icon: "people", category: "accom", color: "#50c878" },
    { id: "secondhand", title: "Second Hand Items", icon: "pricetag", category: "accom", color: "#50c878" },
    { id: "pharmacy", title: "Pharmacy", icon: "medkit", category: "pharma", color: "#8e44ad" },
    { id: "food", title: "Food Delivery", icon: "fast-food", category: "food", color: "#ff7f50" },
    { id: "eshop", title: "Eshop", icon: "bag", category: "shop", color: "#ffb347", badge: 'Hot' },
    { id: "linkme", title: "LinkMe", icon: "heart", category: "local", color: "red" },
    { id: "bundles", title: "Mavo Bingwa Bundles", icon: "wifi", category: "local", color: "#1abc9c" },
    { id: "blogs", title: "Blogs", icon: "book", category: "local", color: "#3498db" }
  ];

  // Function to reorder services based on usage
  const reorderServices = useCallback(async (category = activeTab) => {
    try {
      // Get recommended order based on usage
      const recommendedOrder = await ServiceTrackingService.getRecommendedServiceOrder(category);
      
      if (recommendedOrder && recommendedOrder.length > 0) {
        // Create a map for quick lookup
        const serviceMap = {};
        originalServices.forEach(service => {
          serviceMap[service.id] = service;
        });
        
        // Sort based on recommended order
        const sortedServices = [...originalServices]
          .filter(service => category === 'All' || service.category === category)
          .sort((a, b) => {
            const aIndex = recommendedOrder.indexOf(a.id);
            const bIndex = recommendedOrder.indexOf(b.id);
            
            // If both are in recommended order, sort by that order
            if (aIndex >= 0 && bIndex >= 0) {
              return aIndex - bIndex;
            }
            // If only one is in recommended order, it comes first
            if (aIndex >= 0) return -1;
            if (bIndex >= 0) return 1;
            // If neither are in recommended order, keep original order
            return originalServices.indexOf(a) - originalServices.indexOf(b);
          });
        
        return sortedServices;
      } else {
        return originalServices.filter(service => category === 'All' || service.category === category);
      }
    } catch (error) {
      return originalServices.filter(service => category === 'All' || service.category === category);
    }
  }, [activeTab]);

  // Load and reorder services based on usage
  const loadReorderedServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const sortedServices = await reorderServices(activeTab);
      setReorderedServices(sortedServices);
    } catch (error) {
      setReorderedServices(originalServices.filter(service => 
        activeTab === 'All' || service.category === activeTab
      ));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, reorderServices]);

  // Initial load
  useEffect(() => {
    loadReorderedServices();
  }, [loadReorderedServices]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReorderedServices();
    }, [loadReorderedServices])
  );

  // Refresh when tab changes
  useEffect(() => {
    loadReorderedServices();
  }, [activeTab]);

  // Refresh after a click (with a small delay to ensure data is saved)
  useEffect(() => {
    if (lastClickTime) {
      const timer = setTimeout(() => {
        loadReorderedServices();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [lastClickTime, loadReorderedServices]);

  const handleServicePress = async (service) => {
    // Set click time to trigger reorder
    setLastClickTime(Date.now());
    
    // Track service usage
    await ServiceTrackingService.trackServiceUsage(
      service.id,
      service.title,
      service.category
    );

    // Record screen view
    await DataService.recordScreenView(service.title);

    // Navigation logic
    switch (service.title) {
      case 'LinkMe': navigation.navigate('LinkMe'); break;
      case 'Food Delivery': navigation.navigate('FoodStack', { screen: 'FoodHome' }); break;
      case 'Rental Booking': navigation.navigate('AccomStack', { screen: 'RentalHome' }); break;
      case 'Roommate Finder': navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' }); break;
      case 'Second Hand Items': navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' }); break;
      case 'Pharmacy': navigation.navigate('Echem'); break;
      case 'My University': navigation.navigate('MySchoolNavigator', { screen: 'MySchoolHome' }); break;
      case 'Eshop': navigation.navigate('EshopNavigator'); break;
      case 'Blogs': navigation.navigate('BlogsNavigator'); break;
      case 'Mavo Bingwa Bundles': WebBrowser.openBrowserAsync('https://mvobingwa.godaddysites.com/'); break;
      default:
        if (service.category === 'local') navigation.navigate('LocalServices');
    }
  };

  const filteredServices = useMemo(() => {
    return reorderedServices.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'All' || s.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab, reorderedServices]);

  // Function to toggle between smart sort and default view
  const toggleSort = async () => {
    if (showSmartSort) {
      // Switch back to default view
      setShowSmartSort(false);
      setReorderedServices(originalServices.filter(service => 
        activeTab === 'All' || service.category === activeTab
      ));
    } else {
      // Switch to smart sort view
      setShowSmartSort(true);
      const sortedServices = await reorderServices(activeTab);
      setReorderedServices(sortedServices);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReorderedServices();
  }, [loadReorderedServices]);

  // Get popularity rank for a service
  const getPopularityRank = (serviceId) => {
    const index = reorderedServices.findIndex(s => s.id === serviceId);
    return index + 1;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#083028', '#0a0a0a', '#0a0a0a']} style={StyleSheet.absoluteFill} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#50c878"
            colors={['#50c878']}
          />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>MoiHub Services</Text>
          <TouchableOpacity onPress={toggleSort} style={styles.sortToggle}>
            <Ionicons 
              name={showSmartSort ? "sparkles" : "sparkles-outline"} 
              size={18} 
              color="#50c878" 
            />
            <Text style={styles.sortToggleText}>
              {showSmartSort ? 'Smart' : 'Smart'}
            </Text>
          </TouchableOpacity>
        </View>



        {/* Featured Section */}
        <View style={styles.featuredStaticGrid}>
          <TouchableOpacity 
            style={[styles.featuredCard, { marginRight: 10 }]} 
            onPress={() => navigation.navigate('EmergencyServices')}
          >
            <View style={[styles.featIconCircle, { backgroundColor: '#e74c3c20' }]}>
              <Ionicons name="alert-circle" size={28} color="#e74c3c" />
            </View>
            <Text style={styles.featText}>Emergency</Text>
            <Text style={styles.featSubText}>Tap for help</Text>
          </TouchableOpacity>

<TouchableOpacity 
  style={styles.featuredCard} 
  onPress={() => navigation.navigate('ServicesStack', { screen: 'LocalServices' })}
>
            <View style={[styles.featIconCircle, { backgroundColor: '#9370db20' }]}>
              <Ionicons name="location" size={28} color="#9370db" />
            </View>
            <Text style={styles.featText}>Local Services</Text>
            <Text style={styles.featSubText}>Explore Moi Uni</Text>
          </TouchableOpacity>
        </View>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#50c878" />
          <TextInput 
            placeholder="Search services..." 
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Chips */}
        {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveTab(cat)}
              style={[styles.chip, activeTab === cat && styles.activeChip]}
            >
              <Text style={[styles.chipText, activeTab === cat && styles.activeChipText]}>
                {cat === 'All' ? 'ALL' : cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView> */}

        {/* Smart Sort Indicator */}
        {showSmartSort && (
          <View style={styles.sortIndicator}>
            <Ionicons name="trending-up" size={16} color="#50c878" />
            <Text style={styles.sortIndicatorText}>
              {activeTab === 'All' 
                ? 'Most used services' 
                : `Most used in ${activeTab}`}
            </Text>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#50c878" />
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : (
          /* Main Services Grid */
          <View style={styles.grid}>
            {filteredServices.map((service, idx) => {
              const rank = getPopularityRank(service.id);
              const isTopThree = rank <= 3 && showSmartSort;
              
              return (
                <TouchableOpacity 
                  key={`${service.id}-${idx}`} 
                  style={[
                    styles.serviceCard,
                    isTopThree && styles.topServiceCard
                  ]} 
                  onPress={() => handleServicePress(service)}
                >
                  {service.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{service.badge}</Text>
                    </View>
                  )}
                  
                  {/* Popularity indicator */}
                  <View style={styles.cardHeader}>
                    {showSmartSort && isTopThree && (
                      <View style={[
                        styles.rankBadge,
                        rank === 1 && styles.rankBadgeGold,
                        rank === 2 && styles.rankBadgeSilver,
                        rank === 3 && styles.rankBadgeBronze
                      ]}>
                        <Text style={styles.rankBadgeText}>
                          {rank}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={[styles.iconBox, { backgroundColor: service.color + '20' }]}>
                    <Ionicons name={service.icon} size={24} color={service.color} />
                  </View>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      <WhatsAppFAB />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0a' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5
  },
  headerText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff',
    flex: 1
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 200, 120, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#50c878',
    gap: 4
  },
  sortToggleText: {
    color: '#50c878',
    fontSize: 12,
    fontWeight: '600'
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(80, 200, 120, 0.3)'
  },
  infoText: {
    color: '#50c878',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1
  },
  featuredStaticGrid: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginVertical: 10,
    justifyContent: 'space-between' 
  },
  featuredCard: { 
    flex: 1, 
    height: 100, 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  featIconCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  featText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '700' 
  },
  featSubText: { 
    color: '#888', 
    fontSize: 10, 
    marginTop: 2 
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    marginHorizontal: 20, 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    height: 45, 
    marginBottom: 12 
  },
  input: { 
    flex: 1, 
    marginLeft: 10, 
    color: '#fff', 
    fontSize: 14 
  },
  chipContainer: { 
    paddingLeft: 20, 
    marginBottom: 15 
  },
  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 15, 
    borderWeight: 1, 
    borderColor: '#333', 
    borderWidth: 1, 
    marginRight: 8 
  },
  activeChip: { 
    backgroundColor: '#50c878', 
    borderColor: '#50c878' 
  },
  chipText: { 
    color: '#999', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  activeChipText: { 
    color: '#000' 
  },
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 200, 120, 0.08)',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 15,
  },
  sortIndicatorText: {
    color: '#50c878',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200
  },
  loadingText: {
    color: '#888',
    fontSize: 12,
    marginTop: 10
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 15, 
    justifyContent: 'space-between' 
  },
  serviceCard: { 
    width: '48%', 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderRadius: 15, 
    padding: 12, 
    marginBottom: 12, 
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  topServiceCard: {
    borderColor: 'rgba(80, 200, 120, 0.3)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(80, 200, 120, 0.05)'
  },
  cardHeader: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  rankBadgeGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'rgba(255, 215, 0, 0.4)'
  },
  rankBadgeSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.15)',
    borderColor: 'rgba(192, 192, 192, 0.4)'
  },
  rankBadgeBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.15)',
    borderColor: 'rgba(205, 127, 50, 0.4)'
  },
  rankBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cardTitle: { 
    color: '#eee', 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  badge: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    backgroundColor: '#50c878', 
    paddingHorizontal: 5, 
    paddingVertical: 1, 
    borderRadius: 4 
  },
  badgeText: { 
    color: '#000', 
    fontSize: 8, 
    fontWeight: '900' 
  }
});

export default ServicesScreen;
