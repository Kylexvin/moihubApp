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
  const [showMostUsed, setShowMostUsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(null);

  const categories = ['All', 'uni', 'accom', 'food', 'shop', 'local'];

  // Original services array (this remains your default order)
  const originalServices = [
    { id: "uni", title: "My University", icon: "school", category: "uni", color: "#50c878" },
    { id: "rental", title: "Rental Booking", icon: "home", category: "accom", color: "#50c878", badge: 'New' },
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
      console.log('Recommended Order:', recommendedOrder);
      
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
        
        console.log('Sorted Services:', sortedServices.map(s => ({ id: s.id, title: s.title })));
        return sortedServices;
      } else {
        console.log('No usage data, using original order');
        return originalServices.filter(service => category === 'All' || service.category === category);
      }
    } catch (error) {
      console.error('Error reordering services:', error);
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
      console.error('Error loading reordered services:', error);
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
      }, 500); // Small delay to ensure tracking is complete
      
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

  // Function to toggle between most used and default view
  const toggleView = async () => {
    if (showMostUsed) {
      // Switch back to default view
      setShowMostUsed(false);
      setReorderedServices(originalServices.filter(service => 
        activeTab === 'All' || service.category === activeTab
      ));
    } else {
      // Switch to most used view
      setShowMostUsed(true);
      const sortedServices = await reorderServices(activeTab);
      setReorderedServices(sortedServices);
    }
  };

  // Debug function to view service usage data
  const debugServiceUsage = async () => {
    console.log('=== DEBUG SERVICE USAGE ===');
    const stats = await ServiceTrackingService.getServiceStats();
    console.log('Service Stats:', stats);
    
    const usage = await ServiceTrackingService.getServiceUsage();
    console.log('Service Usage:', usage.map(u => ({ 
      id: u.id, 
      title: u.title, 
      clicks: u.clickCount,
      lastClicked: new Date(u.lastClicked).toLocaleTimeString()
    })));
    
    const recommendedOrder = await ServiceTrackingService.getRecommendedServiceOrder(activeTab);
    console.log('Recommended Order for', activeTab, ':', recommendedOrder);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReorderedServices();
  }, [loadReorderedServices]);

  // Get popularity rank for a service
  const getPopularityRank = (serviceId) => {
    const index = reorderedServices.findIndex(s => s.id === serviceId);
    return index + 1; // Convert to 1-based rank
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
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={debugServiceUsage} style={styles.debugButton}>
              <Ionicons name="bug" size={18} color="#50c878" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleView} style={styles.viewToggle}>
              <Text style={styles.viewToggleText}>
                {showMostUsed ? 'Default' : 'Smart'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="sparkles" size={14} color="#50c878" />
          <Text style={styles.infoText}>
            {showMostUsed ? 'Services sorted by your usage' : 'Tap "Smart" to sort by usage'}
          </Text>
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
            onPress={() => navigation.navigate('LocalServices')}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
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
        </ScrollView>

        {/* Most Used Indicator */}
        {showMostUsed && (
          <View style={styles.mostUsedBanner}>
            <Ionicons name="trending-up" size={16} color="#50c878" />
            <Text style={styles.mostUsedText}>
              {activeTab === 'All' 
                ? 'Showing most used services' 
                : `Most used in ${activeTab}`}
            </Text>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#50c878" />
            <Text style={styles.loadingText}>Personalizing your services...</Text>
          </View>
        ) : (
          /* Main Services Grid */
          <View style={styles.grid}>
            {filteredServices.map((service, idx) => {
              const rank = getPopularityRank(service.id);
              const isTopThree = rank <= 3 && showMostUsed;
              
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
                    {showMostUsed && (
                      <View style={[
                        styles.rankBadge,
                        rank === 1 && styles.rankBadgeGold,
                        rank === 2 && styles.rankBadgeSilver,
                        rank === 3 && styles.rankBadgeBronze
                      ]}>
                        <Text style={styles.rankBadgeText}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={[styles.iconBox, { backgroundColor: service.color + '20' }]}>
                    <Ionicons name={service.icon} size={24} color={service.color} />
                  </View>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                  
                  {/* Usage indicator (small dot that shows if used) */}
                  <View style={styles.usageIndicator} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {/* Reset Order Button (for testing) */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={async () => {
            await ServiceTrackingService.clearServiceUsage();
            loadReorderedServices();
          }}
        >
          <Ionicons name="refresh" size={16} color="#888" />
          <Text style={styles.resetButtonText}> Reset Usage Data</Text>
        </TouchableOpacity>
        
        {/* Usage Stats Preview */}
        <TouchableOpacity 
          style={styles.statsPreview}
          onPress={debugServiceUsage}
        >
          <Text style={styles.statsPreviewText}>
            {showMostUsed ? '👍 Smart sorting is ON' : '💡 Tap "Smart" to sort by usage'}
          </Text>
        </TouchableOpacity>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  viewToggle: {
    backgroundColor: 'rgba(80, 200, 120, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#50c878',
    minWidth: 60,
    alignItems: 'center'
  },
  viewToggleText: {
    color: '#50c878',
    fontSize: 12,
    fontWeight: '600'
  },
  debugButton: {
    padding: 6,
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#50c878'
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
  mostUsedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#ff7f50'
  },
  mostUsedText: {
    color: '#ff7f50',
    fontSize: 12,
    fontWeight: '600',
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
    borderColor: 'rgba(255, 127, 80, 0.3)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 127, 80, 0.05)'
  },
  cardHeader: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  rankBadgeGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.5)'
  },
  rankBadgeSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    borderColor: 'rgba(192, 192, 192, 0.5)'
  },
  rankBadgeBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderColor: 'rgba(205, 127, 50, 0.5)'
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
  },
  usageIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#50c878',
    opacity: 0.7
  },
  resetButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  resetButtonText: {
    color: '#888',
    fontSize: 12
  },
  statsPreview: {
    backgroundColor: 'rgba(80, 200, 120, 0.05)',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(80, 200, 120, 0.1)'
  },
  statsPreviewText: {
    color: '#50c878',
    fontSize: 12,
    fontWeight: '500'
  }
});

export default ServicesScreen;