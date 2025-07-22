import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Needed', 'Please allow notifications to receive important updates.');
        return false;
      }

      return true;

    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }

  }
  // iOS auto-handled by Firebase SDK
  return true;
};
