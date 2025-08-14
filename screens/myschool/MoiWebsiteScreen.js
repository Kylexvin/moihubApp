import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  ImageBackground,
} from 'react-native';

const MoiWebsiteScreen = () => {
  const handleOpenWebsite = () => {
    Linking.openURL('https://www.mu.ac.ke');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/hero.jpg')} 
        style={styles.background}
        imageStyle={{ opacity: 0.3 }} // control image opacity
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Moi University</Text>
          <Text style={styles.description}>
            Moi University is a premier public university located in Eldoret, Kenya. It offers a wide range of academic programs, research opportunities, and a vibrant student life.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleOpenWebsite}>
            <Text style={styles.buttonText}>Visit Website</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f3f7f5ff',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#f5f1f1ff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#36a120ff',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default MoiWebsiteScreen;
