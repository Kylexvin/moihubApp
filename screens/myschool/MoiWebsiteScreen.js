import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';

const MoiWebsiteScreen = () => {
  const handleOpenWebsite = () => {
    Linking.openURL('https://www.mu.ac.ke');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Image
          source={require('../../assets/moihublogo.png')} // Optional: Add Moi Uni logo in assets
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Moi University</Text>

        <Text style={styles.description}>
          Moi University is a premier public university located in Eldoret, Kenya. It offers a wide range of academic programs, research opportunities, and a vibrant student life.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleOpenWebsite}>
          <Text style={styles.buttonText}>Visit Website</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7b20a1',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#7b20a1',
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
