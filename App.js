import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform, View } from 'react-native';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import FoodNavigator from './navigation/FoodNavigator'; 
import AccomStack from './screens/accom/AccomStack';
import RoommateStack from './navigation/RoommateStack';
import SecondHandStack from './navigation/SecondHandStack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FoodProvider } from './context/FoodContext';


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
    <View style={{ flex: 1, backgroundColor: '#093028' }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#093028' },
          animation: 'fade',
          presentation: 'card',
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="SecondHandStack" component={SecondHandStack} options={{ headerShown: false }} /> 
            <Stack.Screen name="FoodStack" component={FoodNavigator} />
            <Stack.Screen name="AccomStack" component={AccomStack} />
            <Stack.Screen name="RoommateStack" component={RoommateStack} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </View>
  );
}

export default function App() {
  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'http://192.168.100.51:5000';

  axios.defaults.baseURL = baseURL;

  return (
    <NavigationContainer theme={MyTheme}>
      <StatusBar style="light" />
      <AuthProvider>
        <FoodProvider>
          <AppNavigator />
        </FoodProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}