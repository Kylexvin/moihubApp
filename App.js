import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import axios from 'axios';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { CartProvider } from './context/CartContext';
import MainTabNavigator from './navigation/MainTabNavigator';
import FoodNavigator from './navigation/FoodNavigator';
import AccomStack from './screens/accom/AccomStack';
import RoommateStack from './navigation/RoommateStack';
import AuthStackNavigator from './navigation/AuthStackNavigator';
import SecondHandStack from './navigation/SecondHandStack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FoodProvider } from './context/FoodContext';
import { SocketProvider } from './context/SocketContext';
import MessageStackNavigator from './navigation/MessageStackNavigator';
import EshopNavigator from './navigation/EshopNavigator';
import LinkMeNavigator from './navigation/LinkMeNavigator';
import MySchoolNavigator from './navigation/MySchoolNavigator';
import BlogsNavigator from './navigation/BlogsNavigator'; 
import EshopOwnerNavigator from './navigation/EshopOwnerNavigator';
import EditProductScreen from './screens/eshop/dashboards/EditProductScreen';
import FoodVendorNavigator from './navigation/FoodVendorNavigator';
import EchemNavigator from './navigation/EchemNavigator';
import ServicesStackNavigator from './navigation/ServicesStackNavigator';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import OnboardingNavigator from './navigation/OnboardingNavigator';
import { handleNotificationNavigation } from './utils/notificationHandler';

const isExpoGo = Constants?.appOwnership === 'expo';
const messaging = !isExpoGo ? require('@react-native-firebase/messaging').default : null;

// Navigation ref for notification handling
const navigationRef = createNavigationContainerRef();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // Changed to false
    shouldSetBadge: false,
  }),
});

if (messaging) {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background FCM message:', remoteMessage);
  });
}

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#093028',
    card: '#093028',
    text: '#E0FFF5',
    border: 'transparent',
    notification: '#00C896',
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
};

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const [appState, setAppState] = useState('splash');
  const [firstLaunch, setFirstLaunch] = useState(null);

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        console.log('Audio mode configured successfully');
      } catch (e) {
        console.log('Error setting audio mode:', e);
      }
    };

    configureAudio();
  }, []);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground FCM message:', remoteMessage);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'MoiHub',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        },
        trigger: null,
      });
    });

    return unsubscribe;
  }, []);

  // Handle notification tap
  useEffect(() => {
    const unsubscribe = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Wait for navigation to be ready, then handle
      if (navigationRef.isReady()) {
        handleNotificationNavigation(navigationRef, data);
      } else {
        // Queue navigation for when ready
        const checkReady = setInterval(() => {
          if (navigationRef.isReady()) {
            clearInterval(checkReady);
            handleNotificationNavigation(navigationRef, data);
          }
        }, 100);
        
        // Clear interval after 5 seconds if still not ready
        setTimeout(() => clearInterval(checkReady), 5000);
      }
    });

    return () => unsubscribe.remove();
  }, []);

  // Handle foreground notifications (removed sound playing)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground Local notification:', notification);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        setFirstLaunch(value === null);
      } catch (error) {
        console.error('AsyncStorage error:', error);
        setFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  const handleSplashComplete = () => {
    if (firstLaunch === null) return;
    setAppState(firstLaunch ? 'onboarding' : 'main');
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('alreadyLaunched', 'true');
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
    }
    setAppState('main');
  };

  if (loading || appState === 'splash') {
    return <SplashScreen onFinish={handleSplashComplete} />;
  }

  if (appState === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <CartProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#093028' },
          animation: 'fade',
          presentation: 'card',
          gestureEnabled: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="SecondHandStack" component={SecondHandStack} />
            <Stack.Screen name="MessageStackNavigator" component={MessageStackNavigator} />
            <Stack.Screen name="FoodStack" component={FoodNavigator} />
            <Stack.Screen name="AccomStack" component={AccomStack} />
            <Stack.Screen name="RoommateStack" component={RoommateStack} />
            <Stack.Screen name='EshopNavigator' component={EshopNavigator} />
            <Stack.Screen name="LinkMe" component={LinkMeNavigator} />
            <Stack.Screen name="MySchoolNavigator" component={MySchoolNavigator} />
            <Stack.Screen name="BlogsNavigator" component={BlogsNavigator} />
            <Stack.Screen name="Eshop" component={EshopOwnerNavigator} />
            <Stack.Screen name="ServicesStack" component={ServicesStackNavigator} />
            <Stack.Screen name="OnboardingNavigator" component={OnboardingNavigator} /> 
            <Stack.Screen
              name="EditProduct"
              component={EditProductScreen}
              options={{ title: 'Edit Product' }}
            />
            <Stack.Screen
              name="Echem"
              component={EchemNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="VendorDashboard" component={FoodVendorNavigator} />
          </>    
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </CartProvider>
  );
}

export default function App() {
  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  axios.defaults.baseURL = baseURL;

  // Set status bar configuration once at app level
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#093028', true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#093028' }}>
        <NavigationContainer ref={navigationRef} theme={MyTheme}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#093028"
            translucent={false}
            hidden={false}
          />
          <AuthProvider>
            <SocketProvider>
              <FoodProvider>
                <AppNavigator />
              </FoodProvider>
            </SocketProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}