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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as WebBrowser from 'expo-web-browser';

const { width, height } = Dimensions.get('window');

const MySchoolLanding = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);


  const mainServices = [
    { 
      name: 'Student Portal', 
      description: 'Access your academic records, grades, and student services',
      icon: 'school', 
      url: 'https://portal.mu.ac.ke/',
      color: '#2E7D32',
      bgColor: '#E8F5E8',
      featured: true,
      available: true
    },
    { 
      name: 'Admissions', 
      description: 'Student admissions and enrollment information. Download admission letters.',
      icon: 'assignment-ind', 
      url: 'https://admissions.mu.ac.ke/',
      color: '#7B1FA2',
      bgColor: '#F3E5F5',
      featured: true,
      available: true
    },
    { 
      name: 'Musomi Learning', 
      description: 'Interactive e-learning platform with courses and resources',
      icon: 'menu-book', 
      url: 'https://elearning.mu.ac.ke/',
      color: '#1565C0',
      bgColor: '#E3F2FD',
      featured: true,
      available: true
    },
    { 
      name: 'HEF/HELB Loans', 
      description: 'Access government-funded student loans and application portal',
      icon: 'account-balance-wallet',
      url: 'https://portal.hef.co.ke/auth/signin',
      color: '#37C015',
      bgColor: '#E8F5E9',
      featured: true,
      available: true
    },
    { 
      name: 'Moi University Website', 
      description: 'Official university website and announcements',
      icon: 'language', 
      url: 'https://www.mu.ac.ke/',
      color: '#F57C00',
      bgColor: '#FFF3E0',
      featured: false,
      available: true
    }
  ];

  const quickServices = [
    { name: 'Organizations and Societies', icon: 'business', screen: 'Organizations', available: true, color: '#9C27B0' },
    { name: 'Past Papers', status: 'Coming Soon', icon: 'description', available: false, color: '#4CAF50' },
    { name: 'Exam Schedule', status: 'Coming Soon', icon: 'event', available: false, color: '#FF9800' },
    { name: 'Library', status: 'Coming Soon', icon: 'local-library', available: false, color: '#2196F3' },
  ];

  const whatsappAiNumbers = [
    {
      name: 'ChatGPT',
      number: '+1 800 242 8478',
      description: 'General AI assistant for questions and help',
      icon: 'chat',
      color: '#10A37F',
      bgColor: '#E8F7F4'
    },
    {
      name: 'Perplexity',
      number: '+1 833 436 3285',
      description: 'Research and information assistant',
      icon: 'search',
      color: '#5A67D8',
      bgColor: '#EDF2F7'
    },
    {
      name: 'August AI',
      number: '+91 87380 30604',
      description: 'Specialized health and wellness assistant',
      icon: 'local-hospital',
      color: '#E53E3E',
      bgColor: '#FED7D7'
    }
  ];

  const handleServicePress = async (service) => {
    if (service.available && service.url) {
      try {
        await WebBrowser.openBrowserAsync(service.url);
      } catch (error) {
        Alert.alert('Error', `Cannot open ${service.name}`);
        console.log('WebBrowser error:', error);
      }
    }
  };



  const copyToClipboard = (text, name) => {
    Clipboard.setString(text);
    Alert.alert(
      'Copied!',
      `${name} number copied to clipboard`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.headerTitle}>MySchool Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon}>
          <Icon name="account-circle" size={40} color="#2E7D32" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeaturedServices = () => (
    <View style={styles.featuredSection}>
      <Text style={styles.sectionTitle}>Quick Access</Text>
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
                <Icon name={service.icon} size={28} color="#FFFFFF" />
              </View>
              <Icon name="arrow-forward" size={20} color={service.color} />
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
    <View style={styles.whatsappSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>AI Assistants</Text>
        <View style={styles.whatsappBadge}>
          <Icon name="chat" size={14} color="#25D366" />
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
                <Icon name={ai.icon} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.copyIconContainer}>
                <Icon name="content-copy" size={16} color={ai.color} />
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
        <Icon name="info-outline" size={16} color="#6B7280" />
        <Text style={styles.disclaimerText}>
          These are third-party AI services. Data charges may apply.
        </Text>
      </View>
    </View>
  );

  const renderAllServices = () => (
    <View style={styles.servicesSection}>
      <Text style={styles.sectionTitle}>All Services</Text>
      <View style={styles.servicesGrid}>
        {mainServices.map((service, index) => (
          <TouchableOpacity
            key={service.name}
            style={styles.serviceCard}
            onPress={() => handleServicePress(service)}
            activeOpacity={0.7}
          >
            <View style={[styles.serviceIcon, { backgroundColor: service.bgColor }]}>
              <Icon name={service.icon} size={24} color={service.color} />
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.subsectionTitle}>Quick Tools</Text>
      <View style={styles.quickToolsGrid}>
        {quickServices.map((service, index) => (
          <TouchableOpacity
            key={service.name}
            style={[
              styles.quickToolCard,
              !service.available && styles.disabledCard
            ]}
            onPress={() => service.available && navigation.navigate(service.screen)}
            disabled={!service.available}
            activeOpacity={service.available ? 0.7 : 1}
          >
            <View style={[styles.quickToolIcon, { backgroundColor: `${service.color}15` }]}>
              <Icon 
                name={service.icon} 
                size={20} 
                color={service.available ? service.color : '#9E9E9E'} 
              />
            </View>
            <View style={styles.quickToolContent}>
              <Text style={[styles.quickToolName, !service.available && styles.disabledText]}>
                {service.name}
              </Text>
              {service.status && (
                <Text style={styles.comingSoonText}>{service.status}</Text>
              )}
            </View>
            {service.available && (
              <Icon name="chevron-right" size={16} color="#C4C4C4" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      {renderHeader()}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderFeaturedServices()}
        {renderWhatsAppAiSection()}
        {renderAllServices()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  profileIcon: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 4,
  },
  
  // Content Styles
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Featured Services Section
  featuredSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featuredGrid: {
    gap: 16,
  },
  featuredCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredCardContent: {
    flex: 1,
  },
  featuredCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  featuredCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // WhatsApp AI Section Styles
  whatsappSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  whatsappBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  whatsappBadgeText: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  aiNumbersGrid: {
    gap: 12,
  },
  aiNumberCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 12,
  },
  aiCardContent: {
    marginBottom: 8,
  },
  aiName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  aiNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  aiDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  tapToCopyHint: {
    alignItems: 'center',
    marginTop: 4,
  },
  tapToCopyText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  aiDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 16,
  },
  
  // Services Section
  servicesSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  serviceCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  
  // Quick Tools
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickToolsGrid: {
    gap: 8,
  },
  quickToolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledCard: {
    opacity: 0.6,
  },
  quickToolIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickToolContent: {
    flex: 1,
  },
  quickToolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  disabledText: {
    color: '#9E9E9E',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Updates Section
  updatesSection: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  updatesScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateCategory: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  updateCategoryText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  updateDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  updateExcerpt: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },  
  updateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default MySchoolLanding;