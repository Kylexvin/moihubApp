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
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
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

// ─── Typing effect hook ───────────────────────────────────────────────────────
const useTypingEffect = (text, speed = 18, enabled = true) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayed(text || '');
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayed, done };
};

// ─── Single bot message with typing + card pop-in ────────────────────────────
const BotMessage = ({ msg, onSuggestion, navigation, setShowAIChatbot }) => {
  const { displayed, done } = useTypingEffect(msg.text, 16, true);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (done && msg.cards && msg.cards.length > 0) {
      Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslate, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [done]);

  const getBadgeColor = (score) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#3B82F6';
    if (score >= 55) return '#F59E0B';
    return '#6B7280';
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) { Alert.alert('No Phone', 'This provider has no phone number'); return; }
    const clean = phoneNumber.replace(/\s+/g, '');
    const formatted = clean.startsWith('+') ? clean : `+${clean}`;
    Linking.openURL(`tel:${formatted}`).catch(() => Alert.alert('Error', 'Could not make phone call'));
  };

  const renderCard = (card) => (
    <View key={card.providerId} style={styles.providerCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardCategory}>{card.category}</Text>
        </View>
        {card.badge && (
          <View style={[styles.badge, { backgroundColor: getBadgeColor(card.matchScore) }]}>
            <Text style={styles.badgeText}>{card.badge}</Text>
          </View>
        )}
      </View>

      {card.matchScore && (
        <View style={styles.matchScoreContainer}>
          <View style={styles.matchScoreBackground}>
            <View style={[styles.matchScoreFill, { width: `${card.matchScore}%`, backgroundColor: getBadgeColor(card.matchScore) }]} />
          </View>
          <Text style={styles.matchScoreText}>{card.matchScore}% match</Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {card.quickInfo?.address || card.locations?.[0] || 'Location not specified'}
          </Text>
        </View>
        {card.rating > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.infoText}>{card.rating.toFixed(1)} ⭐ ({card.totalReviews} {card.totalReviews === 1 ? 'review' : 'reviews'})</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="call" size={14} color="#10B981" />
          <Text style={styles.infoText}>{card.phone}</Text>
        </View>
        {card.quickInfo?.availability && (
          <View style={styles.infoRow}>
            <View style={styles.availableDot} />
            <Text style={[styles.infoText, { color: '#10B981', fontWeight: '600' }]}>{card.quickInfo.availability}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.ctaButton, styles.ctaButtonPrimary]} onPress={() => handleCall(card.phone)} activeOpacity={0.7}>
          <Ionicons name="call" size={16} color="#FFFFFF" />
          <Text style={[styles.ctaText, styles.ctaTextPrimary]}>Call Now</Text>
        </TouchableOpacity>
        {card.hasDashboard && (
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonView]}
            onPress={() => {
              setShowAIChatbot(false);
              navigation.navigate('ProviderProfile', {
                providerId: card.providerId,
                providerName: card.name,
                providerType: 'dashboard',
                providerPhone: card.phone,
                providerAddress: card.quickInfo?.address || card.locations?.[0],
                providerDescription: card.description
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="eye" size={16} color={Colors.primary} />
            <Text style={styles.ctaText}>View Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.botMessageContainer}>
      <View style={styles.botMessage}>
        <Text style={styles.botMessageText}>{displayed}</Text>

        {/* Cursor blink while typing */}
        {!done && <Text style={styles.cursor}>▋</Text>}

        {/* Cards animate in after text done */}
        {done && msg.cards && msg.cards.length > 0 && (
          <Animated.View style={[styles.cardsContainer, { opacity: cardAnim, transform: [{ translateY: cardTranslate }] }]}>
            <View style={styles.cardsHeader}>
              <Ionicons name="business" size={16} color={Colors.primary} />
              <Text style={styles.cardsTitle}>{msg.cards.length} provider{msg.cards.length > 1 ? 's' : ''} found</Text>
            </View>
            {msg.cards.map(card => renderCard(card))}
          </Animated.View>
        )}

        {/* Understood location tag */}
        {done && msg.understood && msg.understood.location !== 'Any location' && (
          <View style={styles.understoodBox}>
            <View style={styles.understoodHeader}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.understoodTitle}>Searching near {msg.understood.location}</Text>
            </View>
          </View>
        )}

        {/* Suggestions after done */}
        {done && msg.suggestions && msg.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Ionicons name="bulb" size={14} color="#F59E0B" />
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
            </View>
            <View style={styles.suggestionChips}>
              {msg.suggestions.map((s, idx) => (
                <TouchableOpacity key={idx} style={styles.suggestionChip} onPress={() => onSuggestion(s)} activeOpacity={0.7}>
                  <Ionicons name="arrow-forward-circle" size={14} color={Colors.primary} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

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

  // AI Chat
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollViewRef = useRef(null);

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

  // ─── AI Chat helpers ────────────────────────────────────────────────────────
  const callAISearch = async (queryText) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setChatMessages(prev => [...prev, { type: 'user', text: queryText }]);

    try {
      const response = await axios.post('/api/services/ai-chat', { query: queryText });
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: response.data.message,
        cards: response.data.cards || [],
        suggestions: response.data.suggestions || [],
        understood: response.data.understood
      }]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: "Sorry, I'm having trouble connecting. Please try again in a moment.",
        suggestions: ['boda boda near gate', 'best kinyozi', 'mama fua', 'matatu services'],
        understood: null
      }]);
    }

    setIsSearching(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSuggestion = (suggestion) => {
    setAiQuery('');
    callAISearch(suggestion);
  };

  const handleSendPress = () => {
    if (aiQuery.trim() && !isSearching) {
      const q = aiQuery;
      setAiQuery('');
      callAISearch(q);
    }
  };

  const handleSubmitEditing = () => {
    if (aiQuery.trim() && !isSearching) {
      const q = aiQuery;
      setAiQuery('');
      callAISearch(q);
    }
  };

  const openAIChat = () => {
    setShowAIChatbot(true);
    if (chatMessages.length === 0) {
      setChatMessages([{
        type: 'bot',
        text: "👋 Hey! I'm MoiHub's AI assistant.\n\nI can help you find services around Moi University — transport, kinyozi, laundry, gas, cyber café, and more!\n\nJust type what you need below.",
        suggestions: ['boda boda near main gate', 'best kinyozi in hostel', 'cheap mama fua', 'matatu to town now']
      }]);
    }
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

  const renderChatMessage = (msg, index) => {
    if (msg.type === 'user') {
      return (
        <View key={index} style={styles.userMessageContainer}>
          <View style={styles.userMessage}>
            <Text style={styles.userMessageText}>{msg.text}</Text>
          </View>
        </View>
      );
    }
    return (
      <BotMessage
        key={index}
        msg={msg}
        onSuggestion={handleSuggestion}
        navigation={navigation}
        setShowAIChatbot={setShowAIChatbot}
      />
    );
  };

  const renderAIChatModal = () => (
    <Modal animationType="slide" transparent={false} visible={showAIChatbot} onRequestClose={() => setShowAIChatbot(false)}>
      <SafeAreaView style={styles.chatModalContainer}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <View style={styles.chatHeaderIcon}>
              <Ionicons name="sparkles" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.chatTitle}>AI Service Finder</Text>
              <Text style={styles.chatSubtitle}>Natural language search</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowAIChatbot(false)} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollViewRef} style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent} showsVerticalScrollIndicator={false}>
          {chatMessages.map((msg, index) => renderChatMessage(msg, index))}
          {isSearching && (
            <View style={styles.botMessageContainer}>
              <View style={styles.botMessage}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>Searching for providers...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar - No voice recording */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <View style={styles.chatInputContainer}>
            <TextInput
              value={aiQuery}
              onChangeText={setAiQuery}
              placeholder="Ask for any service (e.g., 'boda boda near main gate')..."
              placeholderTextColor={Colors.textSecondary}
              style={styles.chatTextInput}
              multiline
              maxLength={200}
              onSubmitEditing={handleSubmitEditing}
              returnKeyType="search"
              blurOnSubmit={false}
            />

            {/* Send button */}
            <TouchableOpacity
              onPress={handleSendPress}
              disabled={isSearching || !aiQuery.trim()}
              style={[styles.sendButton, (!aiQuery.trim() || isSearching) && styles.sendButtonDisabled]}
            >
              <Ionicons name="send" size={20} color={!aiQuery.trim() || isSearching ? Colors.textSecondary : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

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

      <TouchableOpacity style={styles.aiFab} onPress={openAIChat} activeOpacity={0.8}>
        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.aiFabGradient}>
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {renderAIChatModal()}

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

  // Chat modal
  chatModalContainer: { flex: 1, backgroundColor: Colors.background },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder, backgroundColor: Colors.card },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chatHeaderIcon: { width: 48, height: 48, borderRadius: BorderRadius.round, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  chatTitle: { ...Typography.h3, color: Colors.text },
  chatSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  closeButton: { padding: Spacing.xs },

  chatMessages: { flex: 1 },
  chatMessagesContent: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },

  userMessageContainer: { alignItems: 'flex-end', marginBottom: Spacing.md },
  userMessage: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, maxWidth: '80%' },
  userMessageText: { color: '#FFFFFF', fontSize: 15 },

  botMessageContainer: { alignItems: 'flex-start', marginBottom: Spacing.md },
  botMessage: { backgroundColor: Colors.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, maxWidth: '95%', borderWidth: 1, borderColor: Colors.cardBorder },
  botMessageText: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  cursor: { color: Colors.primary, fontSize: 15, fontWeight: '300' },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typingText: { color: Colors.textSecondary, fontSize: 14 },

  understoodBox: { marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.sm, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  understoodHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  understoodTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, marginLeft: 6 },

  cardsContainer: { marginTop: Spacing.md, gap: Spacing.md },
  cardsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  cardsTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginLeft: 6 },

  providerCard: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  cardCategory: { fontSize: 12, color: Colors.textSecondary },
  badge: { paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: BorderRadius.xs },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  matchScoreContainer: { marginTop: 8, marginBottom: 8 },
  matchScoreBackground: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  matchScoreFill: { height: '100%', borderRadius: 2 },
  matchScoreText: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
  availableDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 4 },
  cardInfo: { marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  ctaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.primary, backgroundColor: 'transparent' },
  ctaButtonPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  ctaButtonView: { backgroundColor: 'transparent', borderColor: Colors.primary },
  ctaText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  ctaTextPrimary: { color: '#FFFFFF' },

  suggestionsContainer: { marginTop: Spacing.md },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  suggestionsTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginLeft: 6 },
  suggestionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE', gap: 6 },
  suggestionText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  // Input bar
  chatInputContainer: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.cardBorder, backgroundColor: Colors.card, alignItems: 'center' },
  chatTextInput: { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs, marginRight: Spacing.sm, maxHeight: 100, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.cardBorder },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: Colors.cardBorder },
});

export default Localservices;