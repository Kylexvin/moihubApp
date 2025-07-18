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
      title: 'Platform Statistics',
      subtitle: 'View detailed analytics and metrics',
      icon: 'analytics',
      color: '#6366f1',
      route: 'StatsScreen',
    },
    {
      title: 'Rentals Management',
      subtitle: 'Manage rental listings and bookings',
      icon: 'home',
      color: '#3b82f6',
      route: 'RentalDashboard',
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
      title: 'Users and Notifications',
      subtitle: 'Manage user accounts andnotifications',
      icon: 'people',
      color: '#ef4444',
      route: 'NotificationManagement',
    },
    {
      title: 'Local Services and Organizations',
      subtitle: 'Manage local service providers and Organizations',
      icon: 'business',
      color: '#06b6d4',
      route: 'LocalServicesManagement',
    },
    {
      title: 'Food Vendor',
      subtitle: 'Manage food vendors',
      icon: 'restaurant',
      color: '#ec4899',
      route: 'FoodVendor',
    },
    {
      title: 'Blog Management',
      subtitle: 'Create and manage blog posts',
      icon: 'article',
      color: '#84cc16',
      route: 'BlogManagement',
    },
    {
      title: 'Home Screen',
      subtitle: 'Manage home screen content',
      icon: 'home',
      color: '#6366f1',
      route: 'HomescreenManagement',
    },
  ];

  const handleCardPress = (route) => {
    navigation.navigate(route);
  };



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
       <View style={styles.headerContainer}>
  <Text style={styles.sectionTitle}>📊 Management Dashboard</Text>
</View>
{/* <View style={styles.cardsGrid}>
  <View style={styles.dashboardCard}>
    <Icon name="people-outline" size={28} color="#10B981" />
    <Text style={styles.cardTitle}>Users</Text>
    <Text style={styles.cardValue}>158</Text>
  </View>

  <View style={styles.dashboardCard}>
    <Icon name="work-outline" size={28} color="#3B82F6" />
    <Text style={styles.cardTitle}>Businesses</Text>
    <Text style={styles.cardValue}>7</Text>
  </View>

  <View style={styles.dashboardCard}>
    <Icon name="format-list-bulleted" size={28} color="#F59E0B" />
    <Text style={styles.cardTitle}>Listings</Text>
    <Text style={styles.cardValue}>1</Text>
  </View>

  <View style={styles.dashboardCard}>
    <Icon name="show-chart" size={28} color="#EF4444" />
    <Text style={styles.cardTitle}>Activity</Text>
    <Text style={styles.cardValue}>6</Text>
  </View>
</View> */}



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



      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },   button: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    alignSelf: 'flex-start', // or use 'center', 'flex-end' as needed
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
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

  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 20,
    marginTop: 20,
    textAlign: 'center',
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
 viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  cardsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  marginBottom: 20,
},

dashboardCard: {
  width: '47%',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  paddingVertical: 20,
  paddingHorizontal: 12,
  marginBottom: 16,
  alignItems: 'center',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
},

cardValue: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#1f2937',
  marginTop: 6,
},

});

export default AdminDashboard;