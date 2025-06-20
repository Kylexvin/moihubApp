import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MySchoolLanding from '../screens/myschool/MySchoolLanding';
import PortalScreen from '../screens/myschool/PortalScreen';
import MusomiScreen from '../screens/myschool/MusomiScreen';
import ChatGPTScreen from '../screens/myschool/ChatGPTScreen';
import MoiWebsiteScreen from '../screens/myschool/MoiWebsiteScreen';
import OrganizationScreen from '../screens/myschool/OrganizationScreen';

const Stack = createStackNavigator();

const MySchoolNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="MySchoolHome" 
        component={MySchoolLanding}
        options={{
          title: 'My School',
          headerStyle: {
            backgroundColor: '#4F46E5',
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      />
      <Stack.Screen 
        name="Portal" 
        component={PortalScreen}
        options={{ title: 'Student Portal' }}
      />
      <Stack.Screen 
        name="Musomi" 
        component={MusomiScreen}
        options={{ title: 'Musomi E-Learning' }}
      />
      <Stack.Screen 
        name="ChatGPT" 
        component={ChatGPTScreen}
        options={{ title: 'ChatGPT Assistant' }}
      />
      <Stack.Screen 
        name="MoiWebsite" 
        component={MoiWebsiteScreen}
        options={{ title: 'MOI Website' }}
      />
      <Stack.Screen 
        name="Organizations" 
        component={OrganizationScreen}
        options={{ title: 'Organizations' }}
      />
    </Stack.Navigator>
  );
};

export default MySchoolNavigator;