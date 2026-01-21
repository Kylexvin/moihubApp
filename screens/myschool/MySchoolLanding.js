import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Clipboard,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import Theme from '../theme/Theme';
import DataService from '../../services/DataService';
import ServiceTrackingService from '../../services/ServiceTrackingService';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components } = Theme;

const MySchoolLanding = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mainServices = [
    { 
      id: "student_portal",
      name: 'Student Portal', 
      description: 'Access your academic records, grades, and student services',
      icon: 'school', 
      url: 'https://portal.mu.ac.ke/',
      color: Colors.success,
      bgColor: Colors.success + '20',
      featured: true,
      available: true,
      category: 'uni'
    },
    { 
      id: "admissions",
      name: 'Admissions', 
      description: 'Student admissions and enrollment information. Download admission letters.',
      icon: 'document-text', 
      url: 'https://admissions.mu.ac.ke/',
      color: Colors.accent,
      bgColor: Colors.accent + '20',
      featured: true,
      available: true,
      category: 'uni'
    },
    { 
      id: "musomi",
      name: 'Musomi Learning', 
      description: 'Interactive e-learning platform with courses and resources',
      icon: 'library', 
      url: 'https://elearning.mu.ac.ke/',
      color: Colors.info,
      bgColor: Colors.info + '20',
      featured: true,
      available: true,
      category: 'uni'
    },
    { 
      id: "helf",
      name: 'HEF/HELB Loans', 
      description: 'Access government-funded student loans and application portal',
      icon: 'cash',
      url: 'https://portal.hef.co.ke/auth/signin',
      color: Colors.success,
      bgColor: Colors.success + '20',
      featured: true,
      available: true,
      category: 'uni'
    },
    { 
      id: "website",
      name: 'Moi University Website', 
      description: 'Official university website and announcements',
      icon: 'globe', 
      url: 'https://www.mu.ac.ke/',
      color: Colors.warning,
      bgColor: Colors.warning + '20',
      featured: false,
      available: true,
      category: 'uni'
    }
  ];

  const quickServices = [
    { 
      id: "organizations",
      name: 'Organizations and Societies', 
      icon: 'people', 
      screen: 'Organizations', 
      available: true, 
      color: Colors.accent 
    },
    { 
      id: "past_papers",
      name: 'Past Papers', 
      status: 'Coming Soon', 
      icon: 'documents', 
      available: false, 
      color: Colors.success 
    },
    { 
      id: "exam_schedule",
      name: 'Exam Schedule', 
      status: 'Coming Soon', 
      icon: 'calendar', 
      available: false, 
      color: Colors.warning 
    },
    { 
      id: "library",
      name: 'Library', 
      status: 'Coming Soon', 
      icon: 'book', 
      available: false, 
      color: Colors.info 
    },
  ];

  const whatsappAiNumbers = [
    {
      name: 'ChatGPT',
      number: '+1 800 242 8478',
      description: 'General AI assistant for questions and help',
      icon: 'chatbubble',
      color: '#10A37F',
      bgColor: '#10A37F20'
    },
    {
      name: 'Perplexity',
      number: '+1 833 436 3285',
      description: 'Research and information assistant',
      icon: 'search',
      color: Colors.accent,
      bgColor: Colors.accent + '20'
    },
    {
      name: 'August AI',
      number: '+91 87380 30604',
      description: 'Specialized health and wellness assistant',
      icon: 'medkit',
      color: Colors.danger,
      bgColor: Colors.danger + '20'
    }
  ];

  const handleServicePress = async (service) => {
    if (service.available && service.url) {
      try {
        // Track service usage
        if (service.id) {
          setLastClickTime(Date.now());
          await ServiceTrackingService.trackServiceUsage(
            service.id,
            service.name,
            service.category || 'uni'
          );
        }
        
        await WebBrowser.openBrowserAsync(service.url);
      } catch (error) {
        Alert.alert('Error', `Cannot open ${service.name}`);
        console.log('WebBrowser error:', error);
      }
    }
  };

  const handleQuickServicePress = async (service) => {
    if (service.available && service.screen) {
      // Track service usage
      if (service.id) {
        setLastClickTime(Date.now());
        await ServiceTrackingService.trackServiceUsage(
          service.id,
          service.name,
          'uni'
        );
      }
      
      navigation.navigate(service.screen);
    }
  };

  const copyToClipboard = async (text, name) => {
    Clipboard.setString(text);
    Alert.alert(
      'Copied!',
      `${name} number copied to clipboard`,
      [{ text: 'OK', style: 'default' }]
    );
    
    // Track the copy action
    await DataService.trackUserAction(
      'anonymous',
      'copy_ai_number',
      'MySchoolLanding',
      { ai_name: name }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // You can add data refresh logic here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        
      </View>
      
    </View>
  );

  const renderFeaturedServices = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.featuredGrid}>
        {mainServices.filter(service => service.featured).map((service, index) => (
          <TouchableOpacity
            key={service.name}
            style={[styles.featuredCard, { backgroundColor: service.bgColor }]}
            onPress={() => handleServicePress(service)}
            activeOpacity={0.7}
          >
            <View style={styles.featuredCardHeader}>
              <View style={[styles.featuredIcon, { backgroundColor: service.color }]}>
                <Ionicons name={service.icon} size={28} color="#FFFFFF" />
              </View>
              <Ionicons name="arrow-forward" size={20} color={service.color} />
            </View>
            <View style={styles.featuredCardContent}>
              <Text style={styles.featuredCardTitle}>{service.name}</Text>
              <Text style={styles.featuredCardDescription}>{service.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWhatsAppAiSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>AI Assistants</Text>
        <View style={styles.whatsappBadge}>
          <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
          <Text style={styles.whatsappBadgeText}>WhatsApp</Text>
        </View>
      </View>
      <Text style={styles.sectionSubtitle}>Get instant help from AI assistants via WhatsApp</Text>
      
      <View style={styles.aiNumbersGrid}>
        {whatsappAiNumbers.map((ai, index) => (
          <TouchableOpacity
            key={ai.name}
            style={[styles.aiNumberCard, { backgroundColor: ai.bgColor }]}
            onPress={() => copyToClipboard(ai.number, ai.name)}
            activeOpacity={0.7}
          >
            <View style={styles.aiCardHeader}>
              <View style={[styles.aiIcon, { backgroundColor: ai.color }]}>
                <Ionicons name={ai.icon} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.copyIconContainer}>
                <Ionicons name="copy" size={16} color={ai.color} />
              </View>
            </View>
            
            <View style={styles.aiCardContent}>
              <Text style={styles.aiName}>{ai.name}</Text>
              <Text style={styles.aiNumber}>{ai.number}</Text>
              <Text style={styles.aiDescription}>{ai.description}</Text>
            </View>
            
            <View style={styles.tapToCopyHint}>
              <Text style={styles.tapToCopyText}>Tap to copy</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.aiDisclaimer}>
        <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          These are third-party AI services. Data charges may apply.
        </Text>
      </View>
    </View>
  );

  const renderAllServices = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Services</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.servicesGrid}>
        {mainServices.map((service, index) => (
          <TouchableOpacity
            key={service.name}
            style={styles.serviceCard}
            onPress={() => handleServicePress(service)}
            activeOpacity={0.7}
          >
            <View style={[styles.serviceIcon, { backgroundColor: service.bgColor }]}>
              <Ionicons name={service.icon} size={24} color={service.color} />
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderQuickTools = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Tools</Text>
      <View style={styles.quickToolsGrid}>
        {quickServices.map((service, index) => (
          <TouchableOpacity
            key={service.name}
            style={[
              styles.quickToolCard,
              !service.available && styles.disabledCard
            ]}
            onPress={() => service.available && handleQuickServicePress(service)}
            disabled={!service.available}
            activeOpacity={service.available ? 0.7 : 1}
          >
            <View style={[styles.quickToolIcon, { backgroundColor: service.color + '20' }]}>
              <Ionicons 
                name={service.icon} 
                size={20} 
                color={service.available ? service.color : Colors.textSecondary} 
              />
            </View>
            <View style={styles.quickToolContent}>
              <Text style={[
                styles.quickToolName, 
                !service.available && styles.disabledText
              ]}>
                {service.name}
              </Text>
              {service.status && (
                <Text style={styles.comingSoonText}>{service.status}</Text>
              )}
            </View>
            {service.available && (
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderFeaturedServices()}
        {renderWhatsAppAiSection()}
        {renderAllServices()}
        {renderQuickTools()}
        
        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  

  welcomeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  profileIcon: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.round,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  
  // Section Styles
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  
  // Featured Services
  featuredGrid: {
    gap: Spacing.md,
  },
  featuredCard: {
    ...Components.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredCardContent: {
    flex: 1,
  },
  featuredCardTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  featuredCardDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  
  // WhatsApp AI Section
  whatsappBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D36620',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  whatsappBadgeText: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '600',
  },
  aiNumbersGrid: {
    gap: Spacing.md,
  },
  aiNumberCard: {
    ...Components.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIconContainer: {
    backgroundColor: Colors.card,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  aiCardContent: {
    marginBottom: Spacing.sm,
  },
  aiName: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  aiNumber: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontFamily: 'monospace',
  },
  aiDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  tapToCopyHint: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  tapToCopyText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
  aiDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
    fontSize: 11,
  },
  
  // All Services
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    ...Components.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceName: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  
  // Quick Tools
  quickToolsGrid: {
    gap: Spacing.sm,
  },
  quickToolCard: {
    ...Components.card,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledCard: {
    opacity: 0.6,
  },
  quickToolIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  quickToolContent: {
    flex: 1,
  },
  quickToolName: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  comingSoonText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '500',
    marginTop: 2,
    fontSize: 11,
  },
  
  // Footer Space
  footerSpace: {
    height: Spacing.xl,
  },
});

export default MySchoolLanding;