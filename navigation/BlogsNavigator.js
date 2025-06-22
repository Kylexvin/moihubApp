import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BlogsScreen from '../screens/blogs/BlogsScreen';
import BlogDetailsScreen from '../screens/blogs/BlogDetailsScreen';

const Stack = createStackNavigator();

const BlogsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Blogs" component={BlogsScreen} />
    <Stack.Screen name="BlogDetails" component={BlogDetailsScreen} />
  </Stack.Navigator>
);

export default BlogsNavigator;
