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
      phoneNumber: "0712345678"
    },
    { 
      id: 'medical',
      title: "Health Emergency", 
      icon: "medical", 
      color: "#e74c3c",
      description: "Contact the university health center for medical emergencies.",
      phoneNumber: "0723456789"
    },
    { 
      id: 'fire',
      title: "Fire Emergency", 
      icon: "flame", 
      color: "#e74c3c",
      description: "Report fire incidents and get immediate emergency response.",
      phoneNumber: "0734567890"
    },
    { 
      id: 'report',
      title: "Report Incident", 
      icon: "warning", 
      color: "#e74c3c",
      description: "Report any suspicious activities or incidents that require attention.",
      phoneNumber: "0745678901"
    },
    { 
      id: 'police',
      title: "Police Station", 
      icon: "shield", 
      color: "#e74c3c",
      description: "Contact the nearest police station for law enforcement assistance.",
      phoneNumber: "0756789012"
    },
    { 
      id: 'ambulance',
      title: "Ambulance Services", 
      icon: "fitness", 
      color: "#e74c3c",
      description: "Request an ambulance for medical transportation emergencies.",
      phoneNumber: "0767890123"
    }
  ];

  // Handle call button press
  const handleCallPress = (phoneNumber, title) => {
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
          onPress: () => {
            const phoneUrl = `tel:${phoneNumber}`;
            Linking.canOpenURL(phoneUrl)
              .then(supported => {
                if (supported) {
                  return Linking.openURL(phoneUrl);
                }
              })
              .catch(error => console.error('An error occurred', error));
          }
        }
      ]
    );
  };

  // Handle report incident button press
  const handleReportIncident = () => {
    navigation.navigate('ReportIncident');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Services</Text>
        <View style={styles.placeholder} />
      </View>

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
        </View>
      </View>

      {/* Report Incident Button */}
      <TouchableOpacity 
        style={styles.reportButton}
        onPress={handleReportIncident}
      >
        <Ionicons name="create" size={24} color="#fff" />
        <Text style={styles.reportButtonText}>Report an Incident</Text>
      </TouchableOpacity>

      {/* Emergency Services List */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {emergencyServices.map((service) => (
          <View
            key={service.id}
            style={styles.serviceCard}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: service.color + '20' }]}>
              <Ionicons name={service.icon} size={28} color={service.color} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <Text style={styles.servicePhone}>{service.phoneNumber}</Text>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => handleCallPress(service.phoneNumber, service.title)}
            >
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    marginTop: 16,
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
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#005f4b',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 40,
  }
});

export default EmergencyServices;