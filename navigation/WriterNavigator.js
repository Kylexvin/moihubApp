import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext'; 
import BlogManagement from '../screens/admin/BlogManagement';

const Stack = createStackNavigator();

const WriterAccessControl = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  if (!currentUser || currentUser.role !== 'writer') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Access Denied</Text>
      </View>
    );
  }

  return children;
};

const WriterNavigator = () => {
  return (
    <WriterAccessControl>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WriterBlogManagement" component={BlogManagement} />

      </Stack.Navigator>
    </WriterAccessControl>
  );
};

export default WriterNavigator;
