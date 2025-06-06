import { createStackNavigator } from '@react-navigation/stack';

// Import LinkMe screens
import LinkMeVerificationScreen from '../screens/LinkMe/LinkMeVerificationScreen';
import LinkMeOnboardingScreen from '../screens/LinkMe/LinkMeOnboardingScreen';
import LinkMeSwipeScreen from '../screens/LinkMe/LinkMeSwipeScreen';
import LinkMeProfileScreen from '../screens/LinkMe/LinkMeProfileScreen';
import LinkMeMatchesScreen from '../screens/LinkMe/LinkMeMatchesScreen';
import LinkMeSettingsScreen from '../screens/LinkMe/LinkMeSettingsScreen';

const Stack = createStackNavigator();

const LinkMeNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="LinkMeVerification"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LinkMeVerification" component={LinkMeVerificationScreen} />
      <Stack.Screen name="LinkMeOnboarding" component={LinkMeOnboardingScreen} />
      <Stack.Screen name="LinkMeSwipe" component={LinkMeSwipeScreen} />
      <Stack.Screen name="LinkMeProfile" component={LinkMeProfileScreen} />
      <Stack.Screen name="LinkMeMatches" component={LinkMeMatchesScreen} />
      <Stack.Screen name="LinkMeSettings" component={LinkMeSettingsScreen} />
    </Stack.Navigator>
  );
};

export default LinkMeNavigator;