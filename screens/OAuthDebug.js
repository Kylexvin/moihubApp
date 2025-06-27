// Add this debug component to your app to test OAuth configuration
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

const OAuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const gatherDebugInfo = () => {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const redirectUriNoProxy = AuthSession.makeRedirectUri({ useProxy: false });
      
      const info = {
        // App Configuration
        appName: Constants.expoConfig?.name,
        appSlug: Constants.expoConfig?.slug,
        appOwner: Constants.expoConfig?.owner,
        appScheme: Constants.expoConfig?.scheme,
        
        // Redirect URIs
        redirectUriWithProxy: redirectUri,
        redirectUriWithoutProxy: redirectUriNoProxy,
        
        // Expected vs Actual
        expectedUri: 'https://auth.expo.io/@kylexvin/moihubapp',
        isProxyWorking: redirectUri.includes('auth.expo.io'),
        
        // Environment
        isExpoGo: Constants.appOwnership === 'expo',
        isStandalone: Constants.appOwnership === 'standalone',
        isDevelopment: __DEV__,
        
        // Platform
        platform: Constants.platform,
        
        // Network
        deviceId: Constants.deviceId,
        sessionId: Constants.sessionId,
      };
      
      setDebugInfo(info);
      console.log('🔍 OAuth Debug Info:', JSON.stringify(info, null, 2));
    };

    gatherDebugInfo();
  }, []);

  const testRedirectUri = () => {
    const testUri = AuthSession.makeRedirectUri({ useProxy: true });
    Alert.alert(
      'Redirect URI Test',
      `Generated URI: ${testUri}\n\nExpected: https://auth.expo.io/@kylexvin/moihubapp\n\nMatch: ${testUri === 'https://auth.expo.io/@kylexvin/moihubapp' ? '✅ YES' : '❌ NO'}`
    );
  };

  const copyToClipboard = () => {
    // You can implement clipboard functionality here
    console.log('Debug info copied to console');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Google OAuth Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Configuration</Text>
        <Text style={styles.debugText}>Name: {debugInfo.appName}</Text>
        <Text style={styles.debugText}>Slug: {debugInfo.appSlug}</Text>
        <Text style={styles.debugText}>Owner: {debugInfo.appOwner}</Text>
        <Text style={styles.debugText}>Scheme: {debugInfo.appScheme}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Redirect URIs</Text>
        <Text style={styles.debugText}>With Proxy: {debugInfo.redirectUriWithProxy}</Text>
        <Text style={styles.debugText}>Without Proxy: {debugInfo.redirectUriWithoutProxy}</Text>
        <Text style={styles.debugText}>Expected: {debugInfo.expectedUri}</Text>
        <Text style={[styles.debugText, { color: debugInfo.isProxyWorking ? 'green' : 'red' }]}>
          Proxy Working: {debugInfo.isProxyWorking ? '✅ YES' : '❌ NO'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment</Text>
        <Text style={styles.debugText}>Expo Go: {debugInfo.isExpoGo ? '✅' : '❌'}</Text>
        <Text style={styles.debugText}>Standalone: {debugInfo.isStandalone ? '✅' : '❌'}</Text>
        <Text style={styles.debugText}>Development: {debugInfo.isDevelopment ? '✅' : '❌'}</Text>
        <Text style={styles.debugText}>Platform: {JSON.stringify(debugInfo.platform)}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Test Redirect URI" onPress={testRedirectUri} />
        <Button title="Copy Debug Info" onPress={copyToClipboard} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Troubleshooting Steps</Text>
        <Text style={styles.troubleshootText}>
          1. Ensure you're logged into Expo CLI: `npx expo whoami`{'\n'}
          2. Verify app ownership: `npx expo whoami` should show 'kylexvin'{'\n'}
          3. Check app.json configuration matches above{'\n'}
          4. Try clearing Expo cache: `npx expo start --clear`{'\n'}
          5. Restart Metro bundler completely{'\n'}
          6. If still failing, try EAS Build with dev client
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  debugText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  troubleshootText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
});

export default OAuthDebug;