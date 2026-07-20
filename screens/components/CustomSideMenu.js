// screens/components/CustomSideMenu.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Linking,
  Modal,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext'; // ← Correct path from screens/components/ to context/

const { width, height } = Dimensions.get('window');

const CustomSideMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { currentUser } = useAuth(); // ← Now correctly gets user from AuthContext

  const menuItems = [
    { 
      id: 'about', 
      label: 'About MoiHub', 
      icon: 'information-circle-outline',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      }
    },
    { 
      id: 'team', 
      label: 'Meet the Team', 
      icon: 'people-outline',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      }
    },
    { 
      id: 'vendor', 
      label: 'Become a Vendor', 
      icon: 'business-outline',
      onPress: () => {
        onClose();
        navigation.navigate('OnboardingNavigator');
      }
    },
    { 
      id: 'help', 
      label: 'Help Center', 
      icon: 'help-circle-outline',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      }
    },
    { 
      id: 'contact', 
      label: 'Contact Us', 
      icon: 'mail-outline',
      onPress: () => {
        onClose();
        Linking.openURL('mailto:support@moihub.com');
      }
    },
  ];

  const footerItems = [
    {
      id: 'privacy',
      label: 'Privacy Policy',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      }
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      }
    },
  ];

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.menuContainer}>
          <SafeAreaView style={styles.safeArea}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#01604c" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.drawerHeader}>
              <Image 
                source={require('../../assets/moihublogo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <Text style={styles.appName}>MoiHub</Text>
              <Text style={styles.userName}>
                {currentUser?.username || 'Guest'}
              </Text>
            </View>

            {/* "☰ More" Header */}
            <View style={styles.moreHeader}>
              <Text style={styles.moreHeaderText}>☰ More</Text>
            </View>

            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={24} color="#01604c" />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Footer */}
            <View style={styles.drawerFooter}>
              {footerItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.footerItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.versionContainer}>
                <Text style={styles.versionText}>App Version 1.0.0</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: width * 0.85,
    maxWidth: 320,
    backgroundColor: '#f0f0e1',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#e8e8d8',
    borderRadius: 20,
  },
  drawerHeader: {
    backgroundColor: '#01604c',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  moreHeader: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#e8e8d8',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  moreHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01604c',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#f0f0e1',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 20,
  },
  drawerFooter: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0e1',
  },
  footerItem: {
    paddingVertical: 8,
  },
  footerItemText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  versionContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default CustomSideMenu;