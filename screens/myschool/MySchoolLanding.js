import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const MySchoolLanding = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Portal');
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    setBlogs([
      {
        id: 1,
        title: 'Unit Registration Guide',
        excerpt: 'Step-by-step registration process',
        date: '2024-06-15',
        category: 'Academic'
      },
      {
        id: 2,
        title: 'Academic Calendar 2024/2025',
        excerpt: 'Important dates and deadlines',
        date: '2024-06-10',
        category: 'Calendar'
      },
      {
        id: 3,
        title: 'E-Learning Updates',
        excerpt: 'New Musomi platform features',
        date: '2024-06-08',
        category: 'Platform'
      }
    ]);
  }, []);

  const tabs = [
    { name: 'Portal', icon: 'school', screen: 'Portal' },
    { name: 'Musomi', icon: 'menu-book', screen: 'Musomi' },
    { name: 'ChatGPT', icon: 'smart-toy', screen: 'ChatGPT' },
    { name: 'MOI', icon: 'language', screen: 'MoiWebsite' },
    { name: 'Organizations', icon: 'business', screen: 'Organizations' }
  ];

  const services = [
    { name: 'Past Papers', status: 'Soon', icon: 'description', available: false },
    { name: 'Exam Schedule', status: 'soon', icon: 'event', available: false },
    
  ];

  const handleTabPress = (tab) => {
    setActiveTab(tab.name);
    navigation.navigate(tab.screen);
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <View style={styles.tabWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          decelerationRate="fast"
          snapToInterval={90}
          snapToAlignment="start"
        >
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.tab,
                activeTab === tab.name && styles.activeTab,
                index === 0 && styles.firstTab,
                index === tabs.length - 1 && styles.lastTab
              ]}
              onPress={() => handleTabPress(tab)}
            >
              <Icon 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.name ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.name && styles.activeTabText
              ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Swipe indicators */}
        <View style={styles.swipeIndicators}>
          <View style={styles.leftIndicator}>
            <Icon name="chevron-left" size={16} color="#D1D5DB" />
          </View>
          <View style={styles.rightIndicator}>
            <Icon name="chevron-right" size={16} color="#D1D5DB" />
          </View>
        </View>
      </View>
      
      {/* Breadcrumb dots */}
      <View style={styles.breadcrumbContainer}>
        {tabs.map((tab, index) => (
          <View
            key={tab.name}
            style={[
              styles.breadcrumbDot,
              activeTab === tab.name && styles.activeBreadcrumbDot
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderServices = () => (
    <View style={styles.servicesSection}>
      <View style={styles.servicesGrid}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.serviceCard,
              !service.available && styles.serviceCardDisabled
            ]}
            disabled={!service.available}
          >
            <View style={styles.serviceIconContainer}>
              <Icon 
                name={service.icon} 
                size={28} 
                color={service.available ? '#1B5E20' : '#9E9E9E'} 
              />
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
            <View style={[
              styles.statusBadge,
              service.available ? styles.statusLive : styles.statusSoon
            ]}>
              <Text style={[
                styles.statusText,
                service.available ? styles.statusTextLive : styles.statusTextSoon
              ]}>
                {service.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBlogs = () => (
    <View style={styles.blogsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Updates</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>View all</Text>
          <Icon name="arrow-forward" size={16} color="#2E7D32" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.blogsList}>
        {blogs.map((blog) => (
          <TouchableOpacity key={blog.id} style={styles.blogItem}>
            <View style={styles.blogIconContainer}>
              <Icon name="article" size={20} color="#2E7D32" />
            </View>
            <View style={styles.blogContent}>
              <View style={styles.blogHeader}>
                <Text style={styles.blogCategory}>{blog.category}</Text>
                <Text style={styles.blogDate}>{blog.date}</Text>
              </View>
              <Text style={styles.blogTitle}>{blog.title}</Text>
              <Text style={styles.blogExcerpt}>{blog.excerpt}</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#C4C4C4" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderServices()}
        {renderBlogs()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Tab Bar Styles
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  tabWrapper: {
    position: 'relative',
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 80,
    justifyContent: 'center',
  },
  firstTab: {
    marginLeft: 0,
  },
  lastTab: {
    marginRight: 20,
  },
  activeTab: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  
  // Swipe Indicators
  swipeIndicators: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  leftIndicator: {
    marginLeft: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  rightIndicator: {
    marginRight: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  
  // Breadcrumb Dots
  breadcrumbContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  breadcrumbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  activeBreadcrumbDot: {
    backgroundColor: '#2E7D32',
    width: 20,
  },
  
  // Content Styles
  content: {
    flex: 1,
  },
  
  // Services Section
  servicesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  serviceCardDisabled: {
    opacity: 0.6,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusLive: {
    backgroundColor: '#E8F5E8',
  },
  statusSoon: {
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextLive: {
    color: '#1B5E20',
  },
  statusTextSoon: {
    color: '#8A6914',
  },
  
  // Blogs Section
  blogsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
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
  blogsList: {
    gap: 12,
  },
  blogItem: {
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
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  blogIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blogContent: {
    flex: 1,
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  blogCategory: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  blogDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  blogTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  blogExcerpt: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default MySchoolLanding;