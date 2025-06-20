import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

const MySchoolLanding = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Portal');
  const [blogs, setBlogs] = useState([]);

  // Mock blog data - replace with API call
  useEffect(() => {
    // fetchSchoolBlogs();
    setBlogs([
      {
        id: 1,
        title: 'How to Register for Units - Step by Step Guide',
        excerpt: 'Complete guide on unit registration process...',
        date: '2024-06-15',
        category: 'Registration'
      },
      {
        id: 2,
        title: 'Academic Calendar 2024/2025',
        excerpt: 'Important dates and deadlines for the academic year...',
        date: '2024-06-10',
        category: 'Calendar'
      },
      {
        id: 3,
        title: 'E-Learning Platform Updates',
        excerpt: 'New features and improvements to Musomi platform...',
        date: '2024-06-08',
        category: 'E-Learning'
      }
    ]);
  }, []);

  const tabs = [
    { name: 'Portal', icon: '🎓', screen: 'Portal' },
    { name: 'Musomi', icon: '📚', screen: 'Musomi' },
    { name: 'ChatGPT', icon: '🤖', screen: 'ChatGPT' },
    { name: 'MOI', icon: '🌐', screen: 'MoiWebsite' },
    { name: 'Organizations', icon: '🏢', screen: 'Organizations' }
  ];

  const services = [
    { name: 'Past Papers', status: 'Coming Soon', icon: '📄', color: '#FEF3C7' },
    { name: 'Exam Timetable', status: 'Available', icon: '📅', color: '#D1FAE5' },
    { name: 'Fee Statement', status: 'Available', icon: '💰', color: '#DBEAFE' },
    { name: 'Library Access', status: 'Available', icon: '📖', color: '#E5E7EB' }
  ];

  const handleTabPress = (tab) => {
    setActiveTab(tab.name);
    navigation.navigate(tab.screen);
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              activeTab === tab.name && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              activeTab === tab.name && styles.activeTabText
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.servicesGrid}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.serviceCard, { backgroundColor: service.color }]}
            disabled={service.status === 'Coming Soon'}
          >
            <Text style={styles.serviceIcon}>{service.icon}</Text>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={[
              styles.serviceStatus,
              service.status === 'Coming Soon' && styles.comingSoon
            ]}>
              {service.status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBlogs = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>School Blogs</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {blogs.map((blog) => (
          <TouchableOpacity key={blog.id} style={styles.blogCard}>
            <View style={styles.blogCategory}>
              <Text style={styles.blogCategoryText}>{blog.category}</Text>
            </View>
            <Text style={styles.blogTitle} numberOfLines={2}>
              {blog.title}
            </Text>
            <Text style={styles.blogExcerpt} numberOfLines={3}>
              {blog.excerpt}
            </Text>
            <Text style={styles.blogDate}>{blog.date}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome to My School Hub</Text>
          <Text style={styles.welcomeSubtext}>
            Your one-stop destination for all school services and information
          </Text>
        </View>
        
        {renderServices()}
        {renderBlogs()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>More features coming soon! 🚀</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  comingSoon: {
    color: '#D97706',
  },
  blogCard: {
    width: 280,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  blogCategory: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  blogCategoryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 22,
  },
  blogExcerpt: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  blogDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
});

export default MySchoolLanding;