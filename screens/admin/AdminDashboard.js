import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminDashboard = ({ navigation }) => {
  const { currentUser, logout } = useAuth();

  const adminCards = [
    {
      title: 'Rentals Management',
      subtitle: 'Manage rental listings and bookings',
      icon: 'home',
      color: '#3b82f6',
      route: 'RentalsManagement',
    },
    {
      title: 'E-shops Management',
      subtitle: 'Manage online stores and products',
      icon: 'shopping-cart',
      color: '#10b981',
      route: 'EshopsManagement',
    },
    {
      title: 'LinkMe Management',
      subtitle: 'Manage LinkMe connections',
      icon: 'link',
      color: '#8b5cf6',
      route: 'LinkmeManagement',
    },
    {
      title: 'Second Hands Management',
      subtitle: 'Manage used items marketplace',
      icon: 'refresh',
      color: '#f59e0b',
      route: 'SecondhandsManagement',
    },
    {
      title: 'Push Notifications',
      subtitle: 'Send and manage notifications',
      icon: 'notifications',
      color: '#ef4444',
      route: 'NotificationManagement',
    },
    {
      title: 'Local Services',
      subtitle: 'Manage local service providers',
      icon: 'business',
      color: '#06b6d4',
      route: 'LocalServicesManagement',
    },
    {
      title: 'Roommate Finder',
      subtitle: 'Manage roommate matching',
      icon: 'people',
      color: '#ec4899',
      route: 'RoommateFinderManagement',
    },
    {
      title: 'Blog Management',
      subtitle: 'Create and manage blog posts',
      icon: 'article',
      color: '#84cc16',
      route: 'BlogManagement',
    },
    {
      title: 'News Management',
      subtitle: 'Manage news articles',
      icon: 'newspaper',
      color: '#6366f1',
      route: 'NewsManagement',
    },
  ];

  const handleCardPress = (route) => {
    navigation.navigate(route);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
    

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Management Dashboard</Text>
        
        <View style={styles.cardsContainer}>
          {adminCards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { borderLeftColor: card.color }]}
              onPress={() => handleCardPress(card.route)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: card.color }]}>
                  <Icon name={card.icon} size={28} color="#fff" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

       <View style={styles.statsContainer}>
  <Text style={styles.statsTitle}>Quick Stats</Text>
  <View style={styles.statsGrid}>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Total Users</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Active Listings</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Pending Reviews</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Total Orders</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Rental Units</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Blog Posts</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Food Vendors</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>0</Text>
      <Text style={styles.statLabel}>Online Pharmacies</Text>
    </View>
  </View>
</View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default AdminDashboard;