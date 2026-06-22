import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from './theme/Theme';
import localServicesDB from '../services/LocalServicesDatabase';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

// ─── Main component ───────────────────────────────────────────────────────────
const Localservices = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ─── Category helpers ──────────────────────────────────────────────────────────
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase().trim();
    const iconMap = {
      'matatu services': 'bus', 'matatu': 'bus', 'boda boda': 'bicycle',
      'boda': 'bicycle', 'motorbike services': 'bicycle', 'motorbike': 'bicycle',
      'tuktuk services': 'car', 'tuktuk': 'car', 'mu84': 'bus', 'tuktuk & cart': 'car',
      'transport': 'car', 'parcel delivery': 'cube', 'barbershops': 'cut',
      'barbershop': 'cut', 'kinyozi': 'cut', 'salons': 'cut', 'saloonist': 'cut',
      'salon': 'cut', 'restaurants': 'restaurant', 'restaurant': 'restaurant',
      'baking and pastry': 'restaurant', 'baking': 'restaurant', 'laundry': 'shirt',
      'laundry services': 'shirt', 'mama fua': 'woman', 'dry cleaners': 'shirt',
      'electronic repairs': 'build', 'electronics': 'build', 'cyber café': 'desktop',
      'cyber cafe': 'desktop', 'cyber and printings': 'print', 'branding': 'color-palette',
      'photography & videography': 'camera', 'photography/videography': 'camera',
      'photoshoot services': 'camera', 'carpentry': 'construct', 'capentry services': 'construct',
      'storage services': 'archive', 'errand runners': 'walk', 'gas deliveries': 'flame',
      'gas deliveries services': 'flame', 'poshomill': 'nutrition', 'food': 'ice-cream', 'test': 'star',
    };
    if (iconMap[name]) return iconMap[name];
    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key) || key.includes(name)) return icon;
    }
    return 'business';
  };

  const getCategoryColor = (categoryName) => {
    const name = categoryName.toLowerCase();
    const colorMap = {
      'matatu services': '#10B981', 'boda boda': '#059669', 'motorbike services': '#10B981',
      'transport': '#3B82F6', 'tuktuk services': '#10B981', 'cake': '#F59E0B',
      'poshomill': '#F59E0B', 'gas deliveries': '#F59E0B', 'electronic repairs': '#8B5CF6',
      'cyber café': '#8B5CF6', 'cyber cafe': '#8B5CF6', 'saloonist': '#EC4899',
      'best kinyozi': '#EC4899', 'kinyozi': '#EC4899', 'laundry services': '#06B6D4',
      'mama fua': '#06B6D4', 'photoshoot services': '#EC4899', 'capentry services': '#F59E0B', 'test': '#8B5CF6',
    };
    return colorMap[name] || Colors.primary;
  };

  const initializeCategory = (category) => {
    if (!category) return null;
    const categoryName = category.name || '';
    const icon = getCategoryIcon(categoryName);
    const color = getCategoryColor(categoryName);
    return {
      _id: category.id || category._id, id: category.id || category._id,
      name: categoryName, description: category.description || '',
      icon, color, bgColor: color + '20', isPinned: category.isPinned || false,
      providerCount: category.providerCount || 0,
      allowDashboard: category.allowDashboard || false, allowBooking: category.allowBooking || false
    };
  };

  // ─── AI Chat navigation ────────────────────────────────────────────────────────
  const openAIChat = () => {
    navigation.navigate('AIChat');
  };

  // ─── Data loading ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const initDatabase = async () => {
      try { await localServicesDB.init(); setDbReady(true); }
      catch (error) { console.log('⚠️ Database init failed:', error.message); }
    };
    initDatabase();
  }, []);

  useEffect(() => {
    initializeData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => { filterCategories(); }, [searchQuery, categories]);

  const initializeData = async () => {
    try {
      setLoading(true); setError(null);
      const defaultCategories = [
        { _id: 'matatu_services', id: 'matatu_services', name: 'Matatu Services', description: 'Public transport services around campus', icon: 'bus', color: '#10B981', bgColor: '#10B98120', isPinned: true, providerCount: 12, allowDashboard: false, allowBooking: false },
        { _id: 'boda_boda', id: 'boda_boda', name: 'Boda Boda', description: 'Motorbike taxi and delivery services', icon: 'bicycle', color: '#059669', bgColor: '#05966920', isPinned: true, providerCount: 8, allowDashboard: false, allowBooking: false }
      ];
      setCategories(defaultCategories);
      fetchFreshDataInBackground();
    } catch (error) {
      console.error('❌ Initial load error:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshDataInBackground = async () => {
    try {
      const freshCategories = await fetchFreshData();
      if (freshCategories && freshCategories.length > 0) {
        const merged = mergeCategoriesWithDefaults(freshCategories);
        setCategories(merged);
        setIsOffline(false);
        if (dbReady) { try { await localServicesDB.saveCategories(freshCategories); } catch (e) {} }
        await AsyncStorage.setItem('local_services_cache', JSON.stringify(freshCategories));
        await AsyncStorage.setItem('local_services_cache_time', Date.now().toString());
      }
    } catch (networkError) {
      try {
        const cacheTime = await AsyncStorage.getItem('local_services_cache_time');
        const cacheData = await AsyncStorage.getItem('local_services_cache');
        if (cacheData && cacheTime) {
          const cached = JSON.parse(cacheData);
          if (Date.now() - parseInt(cacheTime) < 86400000) {
            setCategories(mergeCategoriesWithDefaults(cached));
            setIsOffline(true);
            setError('Using cached data. Connect for latest updates.');
          }
        }
      } catch { setIsOffline(true); setError('No internet connection.'); }
    }
  };

  const mergeCategoriesWithDefaults = (freshCategories) => {
    const initialized = freshCategories.map(c => initializeCategory(c)).filter(Boolean);
    const hasMatatu = initialized.some(c => c.name.toLowerCase().includes('matatu'));
    const hasBoda = initialized.some(c => c.name.toLowerCase().includes('boda boda') || c.name.toLowerCase().includes('motorbike'));
    const result = [...initialized];
    if (!hasMatatu) result.push({ _id: 'matatu_services', id: 'matatu_services', name: 'Matatu Services', description: 'Public transport', icon: 'bus', color: '#10B981', bgColor: '#10B98120', isPinned: true, providerCount: 12, allowDashboard: false, allowBooking: false });
    if (!hasBoda) result.push({ _id: 'boda_boda', id: 'boda_boda', name: 'Boda Boda', description: 'Motorbike taxi', icon: 'bicycle', color: '#059669', bgColor: '#05966920', isPinned: true, providerCount: 8, allowDashboard: false, allowBooking: false });
    return result;
  };

  const fetchFreshData = async () => {
    const response = await axios.get('/api/services/categories', { timeout: 8000, headers: { 'Cache-Control': 'no-cache' } });
    let cats = response.data?.categories || [];
    if (!Array.isArray(cats)) cats = [];
    return cats.map(c => {
      const name = (c.name || '').toLowerCase();
      return { ...c, id: c._id, isPinned: name.includes('matatu') || name.includes('boda boda') || name.includes('motorbike'), providerCount: 0 };
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try { await fetchFreshDataInBackground(); } catch {}
    finally { setRefreshing(false); }
  };

  const filterCategories = () => {
    if (!searchQuery.trim()) { setFilteredCategories(categories); return; }
    setFilteredCategories(categories.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
  };

  const handleCategoryPress = (category) => navigation.navigate('CategoryProviders', { categoryId: category._id, categoryName: category.name });
  const handleAddService = () => navigation.navigate('OnboardingNavigator');
  const getPinnedCategories = () => categories.filter(c => c.isPinned);
  const getRegularCategories = () => filteredCategories.filter(c => !c.isPinned);

  // ─── Renders ────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View>
        <Text style={styles.welcomeText}>Moi University</Text>
        <Text style={styles.headerTitle}>Services Hub</Text>
      </View>
      <TouchableOpacity style={styles.addServiceButton} onPress={handleAddService}>
        <Ionicons name="add-circle" size={24} color={Colors.primary} />
        <Text style={styles.addServiceText}>Add Service</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSearchBar = () => (
    <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for services..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderPinnedServices = () => {
    const pinned = getPinnedCategories();
    if (!pinned.length || searchQuery !== '') return null;
    return (
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.featuredTitleContainer}>
            <Ionicons name="star" size={20} color={Colors.warning} />
            <Text style={styles.featuredTitle}>Featured Services</Text>
          </View>
        </View>
        <View style={styles.featuredGrid}>
          {pinned.map(category => (
            <TouchableOpacity key={category._id} style={[styles.featuredGridCard, { backgroundColor: category.bgColor }]} onPress={() => handleCategoryPress(category)} activeOpacity={0.7}>
              <View style={styles.featuredGridCardHeader}>
                <View style={[styles.featuredGridIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.featuredGridBadge}>
                  <Text style={styles.featuredGridBadgeText}>POPULAR</Text>
                </View>
              </View>
              <View style={styles.featuredGridCardContent}>
                <Text style={styles.featuredGridCardTitle} numberOfLines={2}>{category.name}</Text>
                {category.providerCount > 0 && (
                  <View style={styles.featuredGridStats}>
                    <View style={styles.featuredGridStatItem}>
                      <Ionicons name="business" size={12} color={Colors.textSecondary} />
                      <Text style={styles.featuredGridStatText}>{category.providerCount} providers</Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderAllServices = () => {
    const regular = getRegularCategories();
    if (!regular.length && searchQuery) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Search Results</Text></View>
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No services found</Text>
            <Text style={styles.emptyStateDescription}>Try different keywords or check your connection</Text>
          </View>
        </View>
      );
    }
    if (!regular.length) return null;
    return (
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{searchQuery ? `Results (${regular.length})` : 'All Services'}</Text>
          {!searchQuery && regular.length > 0 && <Text style={styles.servicesCount}>{regular.length} services</Text>}
        </View>
        <View style={styles.servicesGrid}>
          {regular.map(category => (
            <TouchableOpacity key={category._id} style={styles.serviceCard} onPress={() => handleCategoryPress(category)} activeOpacity={0.7}>
              <View style={[styles.serviceIcon, { backgroundColor: category.bgColor }]}>
                <Ionicons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.serviceName} numberOfLines={2}>{category.name}</Text>
              {category.providerCount > 0 && (
                <View style={styles.serviceStatus}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={styles.serviceStatusText}>{category.providerCount} available</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderSearchBar()}
        {renderPinnedServices()}
        {renderAllServices()}
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* AI FAB - Now just navigates to the chat screen */}
      <TouchableOpacity style={styles.aiFab} onPress={openAIChat} activeOpacity={0.8}>
        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.aiFabGradient}>
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {isOffline && !loading && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi" size={16} color={Colors.text} />
          <Text style={styles.offlineText}>Offline Mode • Using cached data</Text>
          {refreshing && <ActivityIndicator size="small" color={Colors.text} style={{ marginLeft: 8 }} />}
        </View>
      )}
      {refreshing && !isOffline && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.syncText}>Syncing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, color: Colors.text, ...Typography.body },

  headerContainer: { paddingHorizontal: Spacing.lg, paddingTop: 0, paddingBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeText: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs },
  headerTitle: { ...Typography.h1, color: Colors.text },
  addServiceButton: { backgroundColor: Colors.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  addServiceText: { ...Typography.caption, color: Colors.primary, fontWeight: '600', marginLeft: Spacing.xs },

  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  searchWrapper: { backgroundColor: Colors.card, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text },
  clearButton: { padding: Spacing.xs },

  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  servicesCount: { ...Typography.caption, color: Colors.textSecondary },

  featuredTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featuredTitle: { ...Typography.h3, color: Colors.text },
  featuredGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featuredGridCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2, ...Components.card, padding: Spacing.md, marginBottom: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 0, overflow: 'hidden' },
  featuredGridCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  featuredGridIcon: { width: 40, height: 40, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center' },
  featuredGridBadge: { backgroundColor: Colors.warning, paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: BorderRadius.xs },
  featuredGridBadgeText: { fontSize: 8, color: Colors.text, fontWeight: '700' },
  featuredGridCardContent: { flex: 1 },
  featuredGridCardTitle: { ...Typography.caption, color: Colors.text, fontWeight: '600', fontSize: 13, marginBottom: Spacing.xs, minHeight: 36 },
  featuredGridStats: { flexDirection: 'row', gap: Spacing.sm },
  featuredGridStatItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  featuredGridStatText: { fontSize: 10, color: Colors.textSecondary },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2, ...Components.card, padding: Spacing.md, marginBottom: Spacing.sm, alignItems: 'center' },
  serviceIcon: { width: 48, height: 48, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  serviceName: { ...Typography.caption, color: Colors.text, fontWeight: '600', textAlign: 'center', fontSize: 12, marginBottom: Spacing.xs, minHeight: 32 },
  serviceStatus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  serviceStatusText: { fontSize: 10, color: Colors.success, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyStateTitle: { ...Typography.h4, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.xs },
  emptyStateDescription: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },

  footerSpace: { height: Spacing.xxxl },

  aiFab: { position: 'absolute', bottom: 20, right: Spacing.lg, width: 56, height: 56, borderRadius: BorderRadius.round, overflow: 'hidden', ...Shadows.medium, zIndex: 1000 },
  aiFabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  offlineBanner: { position: 'absolute', bottom: Spacing.lg, left: Spacing.lg, right: Spacing.lg, backgroundColor: Colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder, gap: Spacing.xs },
  offlineText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  
  syncIndicator: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: Colors.primary + '20', padding: Spacing.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  syncText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
});

export default Localservices;