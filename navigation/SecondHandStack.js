import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SecondHandHome from '../screens/secondhand/SecondHandHome';
import MarketplaceDashboardScreen from '../screens/secondhand/MarketplaceDashboardScreen';
import ManageProductScreen from '../screens/secondhand/ManageProductScreen';
import ManageWantedPostScreen from '../screens/secondhand/ManageWantedPostScreen';
import CreateWantedPostScreen from '../screens/secondhand/CreateWantedPostScreen';  
import CreateProductScreen from '../screens/secondhand/CreateProductScreen';


const Stack = createNativeStackNavigator();

const SecondHandStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Public Marketplace Home */}
      <Stack.Screen
        name="SecondHandHome"
        component={SecondHandHome}
        options={{ title: 'Marketplace Home' }}
      />

      {/* User Dashboard */}
      <Stack.Screen
        name="MarketplaceDashboard"
        component={MarketplaceDashboardScreen}
        options={{ title: 'My Marketplace Dashboard' }}
      />

      {/* Manage Products */}
      <Stack.Screen
        name="ManageProduct"
        component={ManageProductScreen}
        options={{ title: 'Manage My Products' }}
      />
      <Stack.Screen
  name="CreateWantedPost"
  component={CreateWantedPostScreen}
  options={{ title: 'Create Wanted Post' }}
/>
      <Stack.Screen
  name="CreateProduct"
  component={CreateProductScreen}
  options={{ title: 'Create Product' }}
/>


      {/* Manage Wanted Posts */}
      <Stack.Screen
        name="ManageWantedPost"
        component={ManageWantedPostScreen}
        options={{ title: 'Manage My Wanted Posts' }}
      />
    </Stack.Navigator>
  );
};

export default SecondHandStack;
