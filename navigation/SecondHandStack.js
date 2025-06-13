import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SecondHandHome from '../screens/secondhand/SecondHandHome';

const Stack = createNativeStackNavigator();

const SecondHandStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        
        headerTitleStyle: {
          fontSize: 16, // Optional: Make title text smaller
        },
      }}
    >
      <Stack.Screen
        name="SecondHandHome"
        component={SecondHandHome}
        options={{ title: 'Second Hand Items' }}
      />
    </Stack.Navigator>
  );
};

export default SecondHandStack;
