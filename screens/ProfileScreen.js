import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ProfileScreen = () => {
  const { currentUser, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const rolesWithDashboard = ['admin', 'writer', 'vendor', 'shopowner'];
  const showDashboardCard = currentUser && rolesWithDashboard.includes(currentUser.role);

const getDashboardInfo = (role) => {
  switch (role) {
    case 'admin':
      return {
        title: 'ADMIN CONTROL',
        subtitle: 'Access Admin Dashboard',
        icon: '⚡',
        route: 'Admin' // Changed from 'AdminDashboard' to 'Admin'
      };
    case 'writer':
      return {
        title: 'WRITER STUDIO',
        subtitle: 'Access Writer Dashboard',
        icon: '✍️',
        route: 'WriterDashboard'
      };
    case 'vendor':
      return {
        title: 'VENDOR PORTAL',
        subtitle: 'Access Vendor Dashboard',
        icon: '📦',
        route: 'VendorDashboard'
      };
    case 'shopowner':
      return {
        title: 'SHOP MANAGER',
        subtitle: 'Access Shop Dashboard',
        icon: '🏪',
        route: 'ShopDashboard'
      };
    default:
      return null;
  }
};

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ff3366';
      case 'writer': return '#00d4ff';
      case 'vendor': return '#9c27b0';
      case 'shopowner': return '#4caf50';
      default: return '#6c7ce7';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#083028" />
      
      {/* Animated Background */}
      <LinearGradient
        colors={['#083028','#0a0a0a',  '#0a0a0a']}
        style={styles.background}
      />
      
      {/* Floating Particles Effect */}
      <View style={styles.particlesContainer}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                animationDelay: `${Math.random() * 3}s`
              }
            ]}
          />
        ))}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <LinearGradient
              colors={['#6c7ce7', '#a055ff', '#ff3366']}
              style={styles.profileImageGradient}
            >
              <View style={styles.profileImage}>
                <Text style={styles.profileImageText}>
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </LinearGradient>
            
            {/* Pulse Ring Animation */}
            <View style={styles.pulseRing} />
            <View style={[styles.pulseRing, styles.pulseRingDelay]} />
          </View>
          
          <Text style={styles.username}>{currentUser?.username}</Text>
          <Text style={styles.email}>{currentUser?.email}</Text>
          
          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(currentUser?.role) }]}>
            <Text style={styles.roleText}>{currentUser?.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(108, 124, 231, 0.1)', 'rgba(108, 124, 231, 0.05)']}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 51, 102, 0.1)', 'rgba(255, 51, 102, 0.05)']}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>142</Text>
              <Text style={styles.statLabel}>Actions</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ACCOUNT MATRIX</Text>
          
          {[
            { label: 'USERNAME', value: currentUser?.username },
            { label: 'EMAIL', value: currentUser?.email },
            { label: 'ACCESS LEVEL', value: currentUser?.role?.toUpperCase() || 'USER' }
          ].map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <LinearGradient
                colors={['rgba(108, 124, 231, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.infoRowGradient}
              >
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
                <View style={styles.infoIndicator} />
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Role-Specific Dashboard Access */}
        {showDashboardCard && (() => {
          const dashboardInfo = getDashboardInfo(currentUser.role);
          return (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate(dashboardInfo.route)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(89, 173, 110, 0.2)', 'rgba(160, 85, 255, 0.2)']}
                style={styles.actionGradient}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>{dashboardInfo.icon}</Text>
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>{dashboardInfo.title}</Text>
                    <Text style={styles.actionSubtitle}>{dashboardInfo.subtitle}</Text>
                  </View>
                  <View style={styles.actionArrow}>
                    <Text style={styles.actionArrowText}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })()}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ff3366', '#ff1744']}
            style={styles.logoutGradient}
          >
            <Text style={styles.logoutText}>LOG OUT</Text>
            <View style={styles.logoutIndicator} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#6c7ce7',
    borderRadius: 1,
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImageGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 57,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pulseRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#6c7ce7',
    opacity: 0.3,
  },
  pulseRingDelay: {
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 80,
    opacity: 0.1,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  statGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c7ce7',
    marginBottom: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  infoRow: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRowGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  infoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6c7ce7',
    opacity: 0.6,
  },
  actionCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(108, 124, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 20,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  actionArrow: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionArrowText: {
    fontSize: 18,
    color: '#6c7ce7',
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#ff3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginRight: 12,
  },
  logoutIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
});

export default ProfileScreen;