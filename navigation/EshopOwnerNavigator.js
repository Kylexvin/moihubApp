import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import VendorDashboard from '../screens/eshop/dashboards/VendorDashboard';
import ProductsScreen from '../screens/eshop/dashboards/ProductsScreen';
import CreateProductScreen from '../screens/eshop/dashboards/CreateProductScreen';
import EditProductScreen from '../screens/eshop/dashboards/EditProductScreen';
import OrdersScreen from '../screens/eshop/dashboards/OrdersScreen';
import VendorProfile from '../screens/eshop/dashboards/VendorProfile';
import { Ionicons } from '@expo/vector-icons';
import theme from '../screens/theme/Theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Products Stack Navigator
const ProductsStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: theme.Colors.background }
      }}
    >
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
    </Stack.Navigator>
  );
};

export default function EshopOwnerNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: theme.Colors.primary,
        tabBarInactiveTintColor: theme.Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'rgba(0, 60, 50, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 100, 80, 0.3)',
          paddingBottom: 5,
          height: 60,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: theme.Colors.textSecondary,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={VendorDashboard}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" color={color} size={size} />
          ),
          tabBarLabel: 'Products',
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" color={color} size={size} />
          ),
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={VendorProfile}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
