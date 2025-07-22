import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MarketplaceDashboardScreen = ({ navigation }) => {

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#047857" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ManageProduct')}
          >
            <Ionicons name="pricetags-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Manage My Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ManageWantedPost')}
          >
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Manage Wanted Posts</Text>
          </TouchableOpacity>
        </View>

        {/* Guidelines */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Marketplace Guidelines</Text>
          <Text style={styles.policyText}>• No fake listings or scams.</Text>
          <Text style={styles.policyText}>• Provide clear product descriptions.</Text>
          <Text style={styles.policyText}>• Mark items as sold when completed.</Text>
          <Text style={styles.policyText}>• Use in-app chat for negotiations.</Text>
        </View>

        {/* Tips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safe Trading Tips</Text>
          <Text style={styles.policyText}>• Verify buyer or seller identity.</Text>
          <Text style={styles.policyText}>• Meet in safe, public places.</Text>
          <Text style={styles.policyText}>• Report suspicious activities.</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>About</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity onPress={() => handleLinkPress('https://moihub-silk.vercel.app/learnmore')}>
              <Text style={styles.footerLink}>Policy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerCopyright}>Made by Kylex</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default MarketplaceDashboardScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#047857' },
  header: { padding: 20, backgroundColor: '#047857' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  content: { padding: 16, backgroundColor: '#ecfdf5', flexGrow: 1 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#047857' },

  actionButton: {
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  actionButtonText: { color: '#fff', marginLeft: 10, fontSize: 16 },

  policyText: { fontSize: 14, color: '#334155', marginBottom: 6 },

  footer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  footerLinks: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  footerLink: { color: '#047857', fontSize: 14, marginHorizontal: 5 },
  footerDivider: { color: '#94a3b8', fontSize: 14 },
  footerText: { fontSize: 12, color: '#64748b' },
  footerCopyright: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
