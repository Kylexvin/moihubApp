import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const HEFLoanScreen = () => {
  const injectedJS = `
    const meta = document.createElement('meta'); 
    meta.setAttribute('name', 'viewport'); 
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'); 
    document.head.appendChild(meta);
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://portal.hef.co.ke' }}
        injectedJavaScript={injectedJS}
        javaScriptEnabled
        startInLoadingState
        scalesPageToFit={false}  // Disable legacy scaling
        renderLoading={() => (
          <ActivityIndicator 
            size="large" 
            color="#37C015" 
            style={styles.loader} 
          />
        )}
      />
    </View>
  );
};

export default HEFLoanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});
