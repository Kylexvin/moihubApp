import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const OrganizationScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Health', 'Religious', 'Tech', 'Academic'];

  const organizations = [
    {
      name: 'Red Cross Kenya',
      category: 'Health',
      description: 'Humanitarian services and health programs',
      icon: '🏥',
      color: '#FEE2E2',
      services: ['Blood Donation', 'First Aid Training', 'Emergency Response']
    },
    {
      name: 'Muslim Organizations',
      category: 'Religious',
      description: 'Islamic community services and support',
      icon: '🕌',
      color: '#E0F2FE',
      services: ['Prayer Times', 'Community Events', 'Religious Education']
    },
    {
      name: 'TSA (Technical Students Association)',
      category: 'Academic',
      description: 'Technical student support and networking',
      icon: '⚙️',
      color: '#F0FDF4',
      services: ['Workshops', 'Career Guidance', 'Technical Support']
    },
    {
      name: 'GDG (Google Developer Groups)',
      category: 'Tech',
      description: 'Developer community and tech events',
      icon: '💻',
      color: '#FEF3C7',
      services: ['Tech Talks', 'Coding Bootcamps', 'Networking Events']
    },
    {
      name: 'Kenya Medical Students Association',
      category: 'Health',
      description: 'Medical student support and advocacy',
      icon: '🩺',
      color: '#F3E8FF',
      services: ['Study Groups', 'Medical Research', 'Health Campaigns']
    },
    {
      name: 'Engineering Students Society',
      category: 'Academic',
      description: 'Engineering student activities and support',
      icon: '🔧',
      color: '#E0E7FF',
      services: ['Project Competitions', 'Industry Visits', 'Mentorship']
    }
  ];

  const filteredOrganizations = selectedCategory === 'All' 
    ? organizations 
    : organizations.filter(org => org.category === selectedCategory);

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.activeCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const handleOrganizationPress = (organization) => {
    // Navigate to specific organization detail screen
    // navigation.navigate('OrganizationDetail', { organization });
    console.log('Navigate to:', organization.name);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Organizations</Text>
        <Text style={styles.headerSubtitle}>Connect with campus organizations</Text>
      </View>

      {renderCategoryTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.organizationsContainer}>
          {filteredOrganizations.map((org, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.organizationCard, { backgroundColor: org.color }]}
              onPress={() => handleOrganizationPress(org)}
            >
              <View style={styles.orgHeader}>
                <Text style={styles.orgIcon}>{org.icon}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{org.category}</Text>
                </View>
              </View>
              
              <Text style={styles.orgName}>{org.name}</Text>
              <Text style={styles.orgDescription}>{org.description}</Text>
              
              <View style={styles.servicesContainer}>
                <Text style={styles.servicesTitle}>Services:</Text>
                <View style={styles.servicesList}>
                  {org.services.map((service, serviceIndex) => (
                    <View key={serviceIndex} style={styles.serviceTag}>
                      <Text style={styles.serviceText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Learn More →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.joinSection}>
          <Text style={styles.joinTitle}>Want to add your organization?</Text>
          <Text style={styles.joinText}>
            Contact the admin to get your organization featured here
          </Text>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Contact Admin</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#C7D2FE',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeCategoryTab: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  organizationsContainer: {
    padding: 16,
  },
  organizationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orgIcon: {
    fontSize: 32,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
  },
  orgName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  orgDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  servicesContainer: {
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 12,
    color: '#475569',
  },
  actionButton: {
    alignSelf: 'flex-end',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  joinSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  joinText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OrganizationScreen;