import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import io from 'socket.io-client';

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
import MessageStackNavigator from './navigation/MessageStackNavigator';
import EshopNavigator from './navigation/EshopNavigator';
import LinkMeNavigator from './navigation/LinkMeNavigator';
import MySchoolNavigator from './navigation/MySchoolNavigator';
import BlogsNavigator from './navigation/BlogsNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import OAuthDebug from './screens/OAuthDebug';




const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'ivory',
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
  const { isAuthenticated, loading, token, currentUser } = useAuth();
  const [appState, setAppState] = useState('splash');
  const [firstLaunch, setFirstLaunch] = useState(null);
  const socketRef = useRef(null);

  const SOCKET_URL = 'https://moihub.onrender.com'; // Adjust as needed

  // Fix status bar configuration
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('light-content', true);
      } else {
        StatusBar.setBarStyle('light-content');
        StatusBar.setBackgroundColor('#093028', true);
        StatusBar.setTranslucent(false);
      }
    }, [])
  );

  // Global socket initialization
  useEffect(() => {
    if (!isAuthenticated || !token || !currentUser) return;
    if (socketRef.current) return;

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        userId: currentUser._id
      },
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('Socket connected globally:', socket.id);
      socket.emit('join_user_room', { userId: currentUser._id });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      console.log('Cleaning up global socket');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, currentUser]);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        setFirstLaunch(value === null);
      } catch (error) {
        console.error("AsyncStorage error:", error);
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
      <View style={{
        flex: 1,
        backgroundColor: '#093028',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
      }}>
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
              <Stack.Screen name="Admin" component={AdminNavigator} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthStackNavigator} />
           
             )}


  <Stack.Screen name="OAuthDebug" component={OAuthDebug} />
</Stack.Navigator>
      </View>
    </CartProvider>
  );
}

export default function App() {
  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  axios.defaults.baseURL = baseURL;

  return (
    <NavigationContainer theme={MyTheme}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#093028"
        translucent={false}
        hidden={false}
      />
      <AuthProvider>
        <FoodProvider>
          <AppNavigator />
        </FoodProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
