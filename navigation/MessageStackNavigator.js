import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatListScreen from '../screens/messages/ChatListScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import NewChatScreen from '../screens/messages/NewChatScreen';

const Stack = createStackNavigator();

const MessageStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ChatList"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen 
        name="NewChatScreen" 
        component={NewChatScreen}
        options={{ title: 'New Chat' }}
      />
    </Stack.Navigator>
  );
};

export default MessageStackNavigator;