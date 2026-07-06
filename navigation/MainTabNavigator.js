import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, View, TouchableOpacity, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import HomeScreen from '../screens/HomeScreen';
import ServicesStackNavigator from './ServicesStackNavigator';
import MessageStackNavigator from './MessageStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Custom AI Button Component with Pulse Animation
const AIChatButton = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.aiButtonContainer}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={['#4A90E2', '#2C5F2D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiButtonGradient}
        >
          <Ionicons name="sparkles" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Dummy component for the tab screen
const DummyScreen = () => {
  return null;
};

// Custom Tab Bar Button Component with proper navigation
const CustomAITabButton = (props) => {
  const navigation = useNavigation();
  
  const handlePress = () => {
    console.log('AI Chat button pressed');
    
    // Try to navigate using the root navigator
    try {
      // Get the root navigation
      let rootNav = navigation;
      while (rootNav.getParent) {
        const parent = rootNav.getParent();
        if (!parent) break;
        rootNav = parent;
      }
      
      // Navigate using the root navigator
      if (rootNav && rootNav.navigate) {
        rootNav.navigate('AIChatNavigator');
        console.log('Navigated via root nav');
        return;
      }
    } catch (e) {
      console.log('Navigation error:', e);
    }
    
    // Fallback to props navigation
    if (props.navigation && props.navigation.navigate) {
      props.navigation.navigate('AIChatNavigator');
      console.log('Navigated via props nav');
    }
  };
  
  return <AIChatButton onPress={handlePress} />;
};

const MainTabNavigator = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#093028' }}>
      <StatusBar barStyle="light-content" backgroundColor="#093028" translucent={false} />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Services') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={focused ? '#fff' : '#bbb'} />;
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#bbb',
          tabBarStyle: {
            height: 60,
            paddingVertical: 5,
            backgroundColor: '#093028',
            borderTopWidth: 0,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 10,
          },
          tabBarItemStyle: {
            marginVertical: 5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />

        <Tab.Screen
          name="Services"
          component={ServicesStackNavigator}
          listeners={({ navigation }) => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('Services', { screen: 'ServicesList' });
            },
          })}
        />

        {/* AI Chat - Custom Floating Button with proper component */}
        <Tab.Screen
          name="AI Chat"
          component={DummyScreen}
          options={{
            tabBarButton: (props) => <CustomAITabButton {...props} />,
          }}
        />

        <Tab.Screen 
          name="Messages" 
          component={MessageStackNavigator}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'ChatList';
            const hideTabBarRoutes = ['ChatScreen', 'NewChatScreen'];
            
            return {
              tabBarStyle: hideTabBarRoutes.includes(routeName) 
                ? { display: 'none' } 
                : {
                    height: 60,
                    paddingVertical: 5,
                    backgroundColor: '#093028',
                    borderTopWidth: 0,
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 10,
                  },
            };
          }}
        />
        
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  aiButtonContainer: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default MainTabNavigator;