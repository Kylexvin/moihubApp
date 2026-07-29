// components/CustomSideMenu.js
import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BRAND = '#01604c';

// Helper function to get dashboard info based on role
const getDashboardInfo = (role) => {
  switch (role) {
    case 'vendor':
      return { 
        title: 'Shop Dashboard', 
       icon: 'pizza-outline',
        route: 'VendorDashboard',
        description: 'Manage your shop',
        tabName: 'VendorDashboard'
      };
    case 'shopowner':
      return { 
        title: 'Shop Manager', 
        icon: 'storefront-outline', 
        route: 'Eshop',
        description: 'Manage your shop',
        tabName: 'Eshop'
      };
    case 'SERVICE_PROVIDER':
      return { 
        title: 'Service Provider', 
        icon: 'construct-outline', 
        route: 'ServiceProviderDashboard',
        description: 'Manage your services',
        tabName: 'ServiceProviderDashboard'
      };
    case 'writer':
      return { 
        title: 'Writer Portal', 
        icon: 'create-outline', 
        route: 'WriterNavigator',
        description: 'Manage your blog posts',
        tabName: 'WriterNavigator'
      };
    case 'admin':
      return { 
        title: 'Admin Portal', 
        icon: 'create-outline', 
        route: 'WriterNavigator',
        description: 'Manage blog posts',
        tabName: 'WriterNavigator'
      };
    default:
      return null;
  }
};

const CustomSideMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { currentUser, logout } = useAuth();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [renderMenu, setRenderMenu] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRenderMenu(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
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
      ]).start(() => {
        setRenderMenu(false);
      });
    }
  }, [visible]);

  // Get dashboard info for current user
  const dashboardInfo = currentUser?.role ? getDashboardInfo(currentUser.role) : null;

  // Navigation helper that works with tab navigator
  const navigateToScreen = (routeName) => {
    onClose();
    
    try {
      // First, try to navigate from the root
      let rootNav = navigation;
      while (rootNav.getParent) {
        const parent = rootNav.getParent();
        if (!parent) break;
        rootNav = parent;
      }

      // Check if we're in a tab navigator
      if (rootNav && rootNav.getState) {
        const state = rootNav.getState();
        const routes = state.routes || [];
        
        // Find if the route exists in the navigation tree
        const routeExists = routes.some(r => r.name === routeName);
        
        if (routeExists) {
          // If route exists at root level, navigate directly
          rootNav.navigate(routeName);
          return;
        }
      }

      // If not found at root, try navigating from the current screen
      // This handles cases where the screen is nested in a tab
      navigation.navigate(routeName);
      
    } catch (error) {
      console.log('Navigation error:', error);
      // Fallback: try to navigate using the navigation object directly
      try {
        navigation.navigate(routeName);
      } catch (e) {
        console.log('Fallback navigation failed:', e);
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    onClose();
    logout();
  };

  // Base menu items
  const baseMenuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      description: 'View and edit profile',
      onPress: () => {
        onClose();
        // Navigate to Profile tab
        navigateToScreen('Profile');
      },
    },
    {
      id: 'about',
      label: 'About MoiHub',
      icon: 'information-circle-outline',
      description: 'Learn more about us',
      onPress: () => {
        onClose();
        Linking.openURL('https://moihub-silk.vercel.app/about');
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
        Linking.openURL('https://moihub-silk.vercel.app/contact');
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
    {
      id: 'logout',
      label: 'Log Out',
      icon: 'log-out-outline',
      description: 'Sign out of your account',
      onPress: handleLogout,
      isLogout: true,
    },
  ];

  // If user has dashboard access, add it as the second item (after Profile)
  const menuItems = dashboardInfo 
    ? [
        baseMenuItems[0], // Profile
        {
          id: 'dashboard',
          label: dashboardInfo.title,
          icon: dashboardInfo.icon,
          description: dashboardInfo.description,
          onPress: () => {
            onClose();
            // Navigate to dashboard
            navigateToScreen(dashboardInfo.route);
          },
        },
        ...baseMenuItems.slice(1), // Rest of items (without Profile)
      ]
    : baseMenuItems;

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

  if (!renderMenu) return null;

  // Helper to get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'vendor':           return '#9c27b0';
      case 'shopowner':        return '#4caf50';
      case 'SERVICE_PROVIDER': return '#2196f3';
      case 'writer':           return '#FF9800';
      case 'admin':            return '#FF9800';
      default:                 return '#6c7ce7';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={renderMenu}
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
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.closeButtonInner}>
                <Ionicons name="close" size={20} color="#1a1a2e" />
              </View>
            </TouchableOpacity>

            {/* Header with Profile Picture and User Info */}
            <LinearGradient
              colors={[BRAND, '#0a7a62']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.drawerHeader}
            >
              <TouchableOpacity 
                style={styles.profileSection}
                onPress={() => {
                  onClose();
                  navigateToScreen('Profile');
                }}
              >
                <View style={styles.profileImageContainer}>
                  {currentUser?.avatar ? (
                    <Image 
                      source={{ uri: currentUser.avatar }} 
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                      <Text style={styles.profileInitial}>
                        {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {currentUser?.username || 'Guest'}
                  </Text>
                  <View style={styles.roleContainer}>
                    <Text style={styles.userRole}>
                      {currentUser?.role?.toUpperCase() || 'USER'}
                    </Text>
                    {currentUser?.role && (
                      <View style={[styles.roleDot, { 
                        backgroundColor: getRoleColor(currentUser.role) 
                      }]} />
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Menu Items */}
            <ScrollView
              style={styles.menuList}
              contentContainerStyle={styles.menuListContent}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item) => {
                const isDashboard = item.id === 'dashboard';
                const isLogout = item.isLogout === true;
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      isDashboard && styles.dashboardMenuItem,
                      isLogout && styles.logoutMenuItem,
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.55}
                  >
                    <View style={[
                      styles.menuIconWrapper,
                      isDashboard && styles.dashboardIconWrapper,
                      isLogout && styles.logoutIconWrapper,
                    ]}>
                      <Ionicons 
                        name={item.icon} 
                        size={isDashboard ? 22 : 20} 
                        color={
                          isLogout ? '#ff3366' : 
                          isDashboard ? '#01604c' : 
                          BRAND
                        } 
                      />
                    </View>
                    <View style={styles.menuTextWrapper}>
                      <Text style={[
                        styles.menuItemText,
                        isDashboard && styles.dashboardMenuItemText,
                        isLogout && styles.logoutMenuItemText,
                      ]}>
                        {item.label}
                      </Text>
                      <Text style={styles.menuItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color={
                        isLogout ? '#ff3366' :
                        isDashboard ? '#01604c' : 
                        '#c2c2c8'
                      } 
                    />
                  </TouchableOpacity>
                );
              })}
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: 14,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTextGroup: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  dashboardMenuItem: {
    backgroundColor: 'rgba(1,96,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(1,96,76,0.12)',
    marginBottom: 6,
  },
  logoutMenuItem: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.12)',
    backgroundColor: 'rgba(255,51,102,0.04)',
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(1,96,76,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  dashboardIconWrapper: {
    backgroundColor: 'rgba(1,96,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(1,96,76,0.2)',
  },
  logoutIconWrapper: {
    backgroundColor: 'rgba(255,51,102,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.12)',
  },
  menuTextWrapper: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 14.5,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  dashboardMenuItemText: {
    color: '#01604c',
  },
  logoutMenuItemText: {
    color: '#ff3366',
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