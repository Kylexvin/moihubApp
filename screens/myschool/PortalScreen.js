import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const PortalScreen = ({ navigation }) => {
  const portalServices = [
    { name: 'Academic Records', icon: '📊', description: 'View your grades and transcripts', color: '#DBEAFE' },
    { name: 'Course Registration', icon: '📝', description: 'Register for new courses', color: '#D1FAE5' },
    { name: 'Fee Payment', icon: '💳', description: 'Pay school fees online', color: '#FEF3C7' },
    { name: 'Timetable', icon: '📅', description: 'View your class schedule', color: '#FCE7F3' },
    { name: 'Library Services', icon: '📚', description: 'Access digital library', color: '#E0E7FF' },
    { name: 'Hostel Management', icon: '🏠', description: 'Hostel booking and services', color: '#F3E8FF' },
  ];

  const quickActions = [
    { name: 'Download Transcript', icon: '⬇️' },
    { name: 'Check Results', icon: '🎯' },
    { name: 'Pay Fees', icon: '💰' },
    { name: 'Book Hostel', icon: '🛏️' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Portal</Text>
        <Text style={styles.headerSubtitle}>Access all your academic services</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionText}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Portal Services</Text>
        <View style={styles.servicesContainer}>
          {portalServices.map((service, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.serviceCard, { backgroundColor: service.color }]}
            >
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.noticeSection}>
        <Text style={styles.noticeTitle}>📢 Important Notice</Text>
        <Text style={styles.noticeText}>
          Portal maintenance scheduled for this weekend. Some services may be temporarily unavailable.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#C7D2FE',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 64) / 2,
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 120,
  },
  serviceIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  noticeSection: {
    backgroundColor: '#FEF3C7',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});

export default PortalScreen;