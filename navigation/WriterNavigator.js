import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WriterDashboardScreen from '../screens/writer/WriterDashboardScreen';
import CreatePostScreen from '../screens/writer/CreatePostScreen';
import PostDetailScreen from '../screens/writer/PostDetailScreen';

const Stack = createStackNavigator();

const WriterNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Stack.Screen
        name="WriterDashboard"
        component={WriterDashboardScreen}
        options={{ title: 'My Blog' }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={({ route }) => ({
          title: route.params?.postId ? 'Edit Post' : 'New Post',
        })}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
    </Stack.Navigator>
  );
};

export default WriterNavigator;