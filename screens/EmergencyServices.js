import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Linking,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

const EmergencyServices = () => {
  const navigation = useNavigation();

  // List of emergency services with emergency numbers
  const emergencyServices = [
    { 
      id: 'security',
      title: "Campus Security", 
      icon: "shield-checkmark", 
      color: "#e74c3c",
      description: "Contact campus security for immediate assistance with security-related concerns.",
      phoneNumber: "0116907378"
    },
    { 
      id: 'medical',
      title: "Health Emergency", 
      icon: "medical", 
      color: "#e74c3c",
      description: "Contact the university health center for medical emergencies.",
      phoneNumber: "0710761679"
    },
    
    { 
      id: 'report',
      title: "Report Incident", 
      icon: "warning", 
      color: "#e74c3c",
      description: "Report any suspicious activities or incidents that require attention.",
      phoneNumber: "0116907378"
    },
   
    { 
      id: 'ambulance',
      title: "Ambulance Services", 
      icon: "fitness", 
      color: "#e74c3c",
      description: "Request an ambulance for medical transportation emergencies.",
      phoneNumber: "0710761679"
    }
  ];

  // Handle call button press with better error handling
  const handleCallPress = async (phoneNumber, title) => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        Alert.alert(
          `Call ${title}`,
          `Are you sure you want to call ${phoneNumber}?`,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            { 
              text: "Call", 
              onPress: async () => {
                try {
                  await Linking.openURL(phoneUrl);
                } catch (error) {
                  console.error('Failed to open dialer:', error);
                  Alert.alert(
                    'Error',
                    'Unable to open phone dialer. Please dial manually or copy the number.',
                    [
                      {
                        text: "Copy Number",
                        onPress: () => copyToClipboard(phoneNumber)
                      },
                      {
                        text: "OK",
                        style: "cancel"
                      }
                    ]
                  );
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Phone Not Available',
          `Cannot open phone dialer. Would you like to copy the number ${phoneNumber} instead?`,
          [
            {
              text: "Copy Number",
              onPress: () => copyToClipboard(phoneNumber)
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking phone availability:', error);
      Alert.alert(
        'Error',
        'Unable to access phone functionality. Would you like to copy the number instead?',
        [
          {
            text: "Copy Number",
            onPress: () => copyToClipboard(phoneNumber)
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    }
  };

  // Copy number to clipboard
  const copyToClipboard = async (phoneNumber) => {
    try {
      await Clipboard.setStringAsync(phoneNumber);
      Alert.alert('Copied!', `Phone number ${phoneNumber} has been copied to clipboard.`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy number to clipboard.');
    }
  };

  // Handle long press to copy number
  const handleLongPress = (phoneNumber, title) => {
    Alert.alert(
      `Copy ${title} Number`,
      `Copy ${phoneNumber} to clipboard?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Copy",
          onPress: () => copyToClipboard(phoneNumber)
        }
      ]
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Emergency Banner */}
      <View style={styles.emergencyBanner}>
        <View style={styles.iconContainerLarge}>
          <Ionicons name="alert-circle" size={36} color="#fff" />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Emergency Help</Text>
          <Text style={styles.bannerDescription}>
            Contact these emergency services for immediate assistance in case of emergencies.
          </Text>
          <Text style={styles.bannerSubtext}>
            Tap to call • Long press to copy number
          </Text>
        </View>
      </View>

      {/* Emergency Services List */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {emergencyServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => handleCallPress(service.phoneNumber, service.title)}
            onLongPress={() => handleLongPress(service.phoneNumber, service.title)}
            activeOpacity={0.7}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: service.color + '20' }]}>
              <Ionicons name={service.icon} size={28} color={service.color} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <Text style={styles.servicePhone}>{service.phoneNumber}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(service.phoneNumber)}
              >
                <Ionicons name="copy" size={18} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCallPress(service.phoneNumber, service.title)}
              >
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },


  placeholder: {
    width: 40,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e74c3c',
    marginHorizontal: 16,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainerLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
bannerDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
    fontStyle: 'italic',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  servicePhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e74c3c',
  },
    copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 40,
  }
});

export default EmergencyServices;