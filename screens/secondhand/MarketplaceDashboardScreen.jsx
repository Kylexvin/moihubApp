import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Dark Warm Amber Theme
const MarketplaceColors = {
  primary: '#03604d',      
  primaryDark: '#0e582a',   // Dark Amber
  primaryLight: '#0b7a0b',  // Light Amber
  secondary: '#10B981',     // Teal (for success/balance)
  accent: '#8B5CF6',        // Purple (for highlights)
  background: '#0F0F0F',    // Near Black
  surface: '#1A1A1A',       // Dark Surface
  card: '#242424',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#9CA3AF', // Gray
  textMuted: '#6B7280',     // Dark Gray
  border: '#2D2D2D',        // Border
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const MarketplaceDashboardScreen = ({ navigation }) => {
  const handleLinkPress = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={MarketplaceColors.background} />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Welcome back!</Text>
            <Text style={styles.headerTitle}>Marketplace Dashboard</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ManageProduct')}
          >
            <View style={[styles.actionIcon, { backgroundColor: MarketplaceColors.primary + '20' }]}>
              <Ionicons name="pricetags-outline" size={24} color={MarketplaceColors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage My Products</Text>
              <Text style={styles.actionSubtitle}>Add, edit or remove your listings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MarketplaceColors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ManageWantedPost')}
          >
            <View style={[styles.actionIcon, { backgroundColor: MarketplaceColors.accent + '20' }]}>
              <Ionicons name="cart-outline" size={24} color={MarketplaceColors.accent} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Wanted Posts</Text>
              <Text style={styles.actionSubtitle}>Items you're looking to buy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MarketplaceColors.accent} />
          </TouchableOpacity>
        </View>

        {/* Guidelines & Tips */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={24} color={MarketplaceColors.primary} />
            <Text style={styles.infoTitle}>Marketplace Guidelines</Text>
          </View>
          
          <View style={styles.guidelinesGrid}>
            <View style={styles.guidelineItem}>
              <Ionicons name="close-circle" size={16} color={MarketplaceColors.error} />
              <Text style={styles.guidelineText}>No fake listings or scams</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="document-text" size={16} color={MarketplaceColors.primary} />
              <Text style={styles.guidelineText}>Clear product descriptions</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={16} color={MarketplaceColors.success} />
              <Text style={styles.guidelineText}>Mark items as sold</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="chatbubbles" size={16} color={MarketplaceColors.accent} />
              <Text style={styles.guidelineText}>Use in-app chat</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoHeader}>
            <Ionicons name="bulb" size={24} color={MarketplaceColors.warning} />
            <Text style={styles.infoTitle}>Safe Trading Tips</Text>
          </View>

          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Verify buyer or seller identity</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Meet in safe, public places</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Report suspicious activities</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <LinearGradient
              colors={[MarketplaceColors.primary + '20', 'transparent']}
              style={styles.footerGradient}
            />
            <View style={styles.footerLinksGrid}>
              <TouchableOpacity 
                style={styles.footerLinkCard}
                onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}
              >
                <View style={[styles.footerLinkIcon, { backgroundColor: MarketplaceColors.primary + '20' }]}>
                  <Ionicons name="information-circle" size={20} color={MarketplaceColors.primary} />
                </View>
                <Text style={styles.footerLinkText}>About</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerLinkCard}
                onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}
              >
                <View style={[styles.footerLinkIcon, { backgroundColor: MarketplaceColors.accent + '20' }]}>
                  <Ionicons name="lock-closed" size={20} color={MarketplaceColors.accent} />
                </View>
                <Text style={styles.footerLinkText}>Privacy</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerLinkCard}
                onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}
              >
                <View style={[styles.footerLinkIcon, { backgroundColor: MarketplaceColors.secondary + '20' }]}>
                  <Ionicons name="document-text" size={20} color={MarketplaceColors.secondary} />
                </View>
                <Text style={styles.footerLinkText}>Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerTagline}>Buy • Sell • Connect</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: MarketplaceColors.background },
  
  header: { 
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff',
  },

  content: { 
    padding: 16, 
    backgroundColor: MarketplaceColors.background, 
    flexGrow: 1 
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MarketplaceColors.text,
    marginBottom: 16,
  },

  actionCard: {
    backgroundColor: MarketplaceColors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MarketplaceColors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: MarketplaceColors.textSecondary,
  },

  infoSection: {
    backgroundColor: MarketplaceColors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MarketplaceColors.text,
  },

  guidelinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  guidelineText: {
    fontSize: 13,
    color: MarketplaceColors.textSecondary,
    flex: 1,
  },

  divider: {
    height: 1,
    backgroundColor: MarketplaceColors.border,
    marginVertical: 16,
  },

  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MarketplaceColors.primary,
    marginRight: 10,
  },
  tipText: {
    fontSize: 14,
    color: MarketplaceColors.textSecondary,
    flex: 1,
  },

  footer: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: MarketplaceColors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    overflow: 'hidden',
  },
  footerTop: {
    position: 'relative',
  },
  footerGradient: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    height: 100,
  },
  footerLinksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerLinkCard: {
    alignItems: 'center',
    gap: 8,
  },
  footerLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: MarketplaceColors.text,
  },
  footerBottom: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: MarketplaceColors.border,
    paddingTop: 16,
  },
  footerTagline: {
    fontSize: 11,
    color: MarketplaceColors.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default MarketplaceDashboardScreen;