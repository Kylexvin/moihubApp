// OnboardingNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import VendorOnboardingScreen from '../screens/VendorOnboardingScreen';

const Stack = createStackNavigator();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="VendorOnboarding" component={VendorOnboardingScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;

// -------------------

// Usage in App.js:
// Import: import OnboardingNavigator from './OnboardingNavigator';
// Add to your authenticated stack:
// <Stack.Screen name="OnboardingFlow" component={OnboardingNavigator} />