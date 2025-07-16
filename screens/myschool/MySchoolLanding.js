import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const MySchoolLanding = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    setBlogs([
      {
        id: 1,
        title: 'Unit Registration Guide',
        excerpt: 'Step-by-step registration process for the new semester',
        date: '2024-06-15',
        category: 'Academic',
        readTime: '5 min read'
      },
      {
        id: 2,
        title: 'Academic Calendar 2024/2025',
        excerpt: 'Important dates and deadlines you need to know',
        date: '2024-06-10',
        category: 'Calendar',
        readTime: '3 min read'
      },
      {
        id: 3,
        title: 'E-Learning Updates',
        excerpt: 'New Musomi platform features and improvements',
        date: '2024-06-08',
        category: 'Platform',
        readTime: '4 min read'
      }
    ]);
  }, []);

  const mainServices = [
    { 
      name: 'Student Portal', 
      description: 'Access your academic records, grades, and student services',
      icon: 'school', 
      screen: 'Portal',
      color: '#2E7D32',
      bgColor: '#E8F5E8',
      featured: true,
      available: true
    },
    { 
      name: 'Admissions', 
      description: 'Student admissions and enrollment information. Download admission letters.',
      icon: 'assignment-ind', 
      screen: 'Admissions',
      color: '#7B1FA2',
      bgColor: '#F3E5F5',
      featured: true,
      available: true
    },

    { 
      name: 'Musomi Learning', 
      description: 'Interactive e-learning platform with courses and resources',
      icon: 'menu-book', 
      screen: 'Musomi',
      color: '#1565C0',
      bgColor: '#E3F2FD',
      featured: true,
      available: true
    },

    { 
      name: 'Moi University Website', 
      description: 'Official university website and announcements',
      icon: 'language', 
      screen: 'MoiWebsite',
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

  const handleServicePress = (service) => {
    if (service.available && service.screen) {
      navigation.navigate(service.screen);
    }
  };

  const handleBlogPress = (blog) => {
    // You can add navigation to a blog detail screen here if needed
    console.log('Blog pressed:', blog.title);
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
            onPress={() => handleServicePress(service)}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
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