import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { View, Text, StyleSheet } from 'react-native';

// Import screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import RentalsManagement from '../screens/admin/RentalsManagement';
import EshopsManagement from '../screens/admin/EshopsManagement';
import LinkmeManagement from '../screens/admin/LinkmeManagement';
import SecondhandsManagement from '../screens/admin/SecondhandsManagement';
import NotificationManagement from '../screens/admin/NotificationManagement';
import LocalServicesManagement from '../screens/admin/LocalServicesManagement';
import RoommateFinderManagement from '../screens/admin/RoommateFinderManagement';
import BlogManagement from '../screens/admin/BlogManagement';
import NewsManagement from '../screens/admin/NewsManagement';

const Stack = createStackNavigator();

// Admin Access Control Component
const AdminAccessControl = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>Access Denied</Text>
        <Text style={styles.accessDeniedSubtext}>
          You don't have permission to access the admin panel.
        </Text>
      </View>
    );
  }

  return children;
};

const AdminNavigator = () => {
  return (
    <AdminAccessControl>
      <Stack.Navigator
        initialRouteName="AdminDashboard"
       
      >
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{
            title: 'Admin Dashboard',
            headerLeft: null, // Disable back button on main dashboard
          }}
        />
        <Stack.Screen
          name="RentalsManagement"
          component={RentalsManagement}
          options={{ title: 'Rentals Management' }}
        />
        <Stack.Screen
          name="EshopsManagement"
          component={EshopsManagement}
          options={{ title: 'E-shops Management' }}
        />
        <Stack.Screen
          name="LinkmeManagement"
          component={LinkmeManagement}
          options={{ title: 'LinkMe Management' }}
        />
        <Stack.Screen
          name="SecondhandsManagement"
          component={SecondhandsManagement}
          options={{ title: 'Second Hands Management' }}
        />
        <Stack.Screen
          name="NotificationManagement"
          component={NotificationManagement}
          options={{ title: 'Push Notifications' }}
        />
        <Stack.Screen
          name="LocalServicesManagement"
          component={LocalServicesManagement}
          options={{ title: 'Local Services Management' }}
        />
        <Stack.Screen
          name="RoommateFinderManagement"
          component={RoommateFinderManagement}
          options={{ title: 'Roommate Finder Management' }}
        />
        <Stack.Screen
          name="BlogManagement"
          component={BlogManagement}
          options={{ title: 'Blog Management' }}
        />
        <Stack.Screen
          name="NewsManagement"
          component={NewsManagement}
          options={{ title: 'News Management' }}
        />
      </Stack.Navigator>
    </AdminAccessControl>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default AdminNavigator;