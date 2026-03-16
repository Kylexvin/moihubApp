import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MySchoolLanding from '../screens/myschool/MySchoolLanding';
import PortalScreen from '../screens/myschool/PortalScreen';
import MusomiScreen from '../screens/myschool/MusomiScreen';
import AdmissionsScreen from '../screens/myschool/AdmissionsScreen';
import MoiWebsiteScreen from '../screens/myschool/MoiWebsiteScreen';
import OrganizationScreen from '../screens/myschool/OrganizationScreen';

const Stack = createStackNavigator();

const MySchoolNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MySchoolHome" component={MySchoolLanding} />
      <Stack.Screen name="Portal" component={PortalScreen} />
      <Stack.Screen name="Musomi" component={MusomiScreen} />
      <Stack.Screen name="Admissions" component={AdmissionsScreen} />
      <Stack.Screen name="MoiWebsite" component={MoiWebsiteScreen} />
      <Stack.Screen name="Organizations" component={OrganizationScreen} />
     
    </Stack.Navigator>
  );
};

export default MySchoolNavigator;
