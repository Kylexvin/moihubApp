import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SecondHandHome from '../screens/secondhand/SecondHandHome';

const Stack = createNativeStackNavigator();

const SecondHandStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="SecondHandHome" component={SecondHandHome} options={{ title: 'Second Hand Items' }} />
    </Stack.Navigator>
  );
};

export default SecondHandStack;
