// components/CustomSideMenu.js
import React, { useEffect, useRef } from 'react';
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
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const CustomSideMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const menuItems = [
    { 
      id: 'about', 
      label: 'About MoiHub', 
      icon: 'information-circle-outline',
      description: 'Learn more about us',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      }
    },
{ 
  id: 'team', 
  label: 'Meet the Team', 
  icon: 'people-outline',
  description: 'The people behind MoiHub',
  onPress: () => {
    onClose();
    navigation.navigate('TeamNavigator');
  }
},
    { 
      id: 'vendor', 
      label: 'Become a Vendor', 
      icon: 'business-outline',
      description: 'List your business today',
      onPress: () => {
        onClose();
        navigation.navigate('OnboardingNavigator');
      }
    },
    { 
      id: 'help', 
      label: 'Help Center', 
      icon: 'help-circle-outline',
      description: 'Get support',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      }
    },
    { 
      id: 'contact', 
      label: 'Contact Us', 
      icon: 'mail-outline',
      description: 'Reach out to us',
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

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.menuContainer,
            { transform: [{ translateX: slideAnim }] } // ← THIS IS THE FIX - translateX NOT translateY
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View style={styles.closeButtonInner}>
                <Ionicons name="close" size={22} color="#1a1a2e" />
              </View>
            </TouchableOpacity>

            {/* Minimal Header */}
            <LinearGradient
              colors={['#01604c', '#0a7a62']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.drawerHeader}
            >
              <View style={styles.headerContent}>
                <View style={styles.logoWrapper}>
                  <Image 
                    source={require('../assets/moihublogo.png')} 
                    style={styles.logo} 
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.appName}>MoiHub</Text>
                  <View style={styles.userBadge}>
                    <Ionicons name="person-outline" size={14} color="#FFF" />
                    <Text style={styles.userName}>
                      {currentUser?.username || 'Guest'}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Menu Items */}
            <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index === menuItems.length - 1 && styles.menuItemLast
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <View style={styles.menuIconWrapper}>
                    <Ionicons name={item.icon} size={22} color="#01604c" />
                  </View>
                  <View style={styles.menuTextWrapper}>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#b0b0b0" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.drawerFooter}>
              <View style={styles.footerDivider} />
              <View style={styles.footerLinks}>
                {footerItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.footerItem}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.footerItemText}>{item.label}</Text>
                    </TouchableOpacity>
                    {index < footerItems.length - 1 && (
                      <View style={styles.footerDot} />
                    )}
                  </React.Fragment>
                ))}
              </View>
              <View style={styles.versionContainer}>
                <Text style={styles.versionText}>App Version 1.0.0</Text>
                <Text style={styles.footerCopyright}>✟𝗞𝗬𝗟𝗘𝗫✟</Text>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row', // ← THIS IS IMPORTANT - row not column
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuContainer: {
    width: 'auto',
    minWidth: 220,
    maxWidth: width * 0.82,
    backgroundColor: '#f0f0e1',
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0e1',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  drawerHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerTextWrapper: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginLeft: 6,
    fontWeight: '400',
  },
  menuList: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  menuItemLast: {
    marginBottom: 8,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(1,96,76,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextWrapper: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#8a8a8a',
    marginTop: 2,
  },
  drawerFooter: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0e1',
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerItem: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  footerItemText: {
    fontSize: 11,
    color: '#8a8a8a',
    fontWeight: '500',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d0d0d0',
    marginHorizontal: 6,
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 10,
    color: '#b0b0b0',
    fontWeight: '400',
  },
  footerCopyright: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default CustomSideMenu;
