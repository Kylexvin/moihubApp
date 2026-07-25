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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BRAND = '#01604c';

const CustomSideMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          // snappier than before — less travel time, less overshoot wobble
          tension: 90,
          friction: 14,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
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
      },
    },
    {
      id: 'team',
      label: 'Our Team',
      icon: 'people-outline',
      description: 'People behind',
      onPress: () => {
        onClose();
        navigation.navigate('TeamNavigator');
      },
    },
    {
      id: 'vendor',
      label: 'Own A Shop',
      icon: 'business-outline',
      description: 'Set a business',
      onPress: () => {
        onClose();
        navigation.navigate('OnboardingNavigator');
      },
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: 'help-circle-outline',
      description: 'Get support',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      },
    },
    {
      id: 'contact',
      label: 'Contact Us',
      icon: 'mail-outline',
      description: 'Reach out to us',
      onPress: () => {
        onClose();
        Linking.openURL('mailto:info.moihub@gmail.com');
      },
    },
  ];

  const footerItems = [
    {
      id: 'privacy',
      label: 'Privacy Policy',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      },
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/learnmore');
      },
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
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.menuContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View style={styles.closeButtonInner}>
                <Ionicons name="close" size={20} color="#1a1a2e" />
              </View>
            </TouchableOpacity>

            {/* Header */}
            <LinearGradient
              colors={[BRAND, '#0a7a62']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.drawerHeader}
            >
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../assets/moihublogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>MoiHub</Text>
              <View style={styles.userBadge}>
                <Ionicons name="person-outline" size={12} color="#FFF" />
                <Text style={styles.userName}>
                  {currentUser?.username || 'Guest'}
                </Text>
              </View>
            </LinearGradient>

            {/* Menu Items */}
            <ScrollView
              style={styles.menuList}
              contentContainerStyle={styles.menuListContent}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.55}
                >
                  <View style={styles.menuIconWrapper}>
                    <Ionicons name={item.icon} size={20} color={BRAND} />
                  </View>
                  <View style={styles.menuTextWrapper}>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                    <Text style={styles.menuItemDescription}>
                      {item.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#c2c2c8" />
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
                      activeOpacity={0.6}
                    >
                      <Text style={styles.footerItemText}>{item.label}</Text>
                    </TouchableOpacity>
                    {index < footerItems.length - 1 && (
                      <View style={styles.footerDot} />
                    )}
                  </React.Fragment>
                ))}
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,15,14,0.55)',
  },
  menuContainer: {
    width: 'auto',
    minWidth: 230,
    maxWidth: width * 0.8,
    backgroundColor: '#FAFAF8',
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
  },
  closeButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  drawerHeader: {
    paddingTop: Platform.OS === 'ios' ? 46 : 36,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  logoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  appName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userName: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 5,
    fontWeight: '400',
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(1,96,76,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  menuTextWrapper: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 14.5,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: 11.5,
    color: '#9a9aa2',
    marginTop: 1,
  },
  drawerFooter: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingHorizontal: 16,
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
    color: '#9a9aa2',
    fontWeight: '500',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d0d0d0',
    marginHorizontal: 6,
  },
});

export default CustomSideMenu;