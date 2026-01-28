// screens/localservices/components/InfoTab.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius } = Theme;

const InfoTab = ({ infoData, overviewData, handleGetDirections, handleCall, handleChat }) => {
  if (!infoData && overviewData?.tabs?.info?.hasData) {
    return (
      <View style={styles.tabContent}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={styles.tabContent}>
      {/* About Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About {overviewData?.header?.name}</Text>
        <Text style={styles.sectionText}>
          {infoData?.about || overviewData?.header?.description || 'No description available'}
        </Text>
      </View>
      
      {/* Stats */}
      {overviewData?.stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overviewData.stats.yearsInBusiness || 0}+</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overviewData.stats.totalBookings || 0}+</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overviewData.stats.services || 0}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
        </View>
      )}
      
      {/* Hours */}
      {infoData?.hours && infoData.hours.length > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          {infoData.hours.map((hour, index) => (
            <View key={index} style={styles.hourRow}>
              <Text style={styles.hourDay}>{hour.day}</Text>
              <Text style={styles.hourTime}>{hour.time}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Map */}
      {(infoData?.coordinates || overviewData?.header?.location) && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Location & Directions</Text>
          {infoData?.coordinates ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: infoData.coordinates.latitude,
                  longitude: infoData.coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={infoData.coordinates}
                  title={overviewData?.header?.name}
                  description={overviewData?.header?.location}
                >
                  <View style={styles.mapMarker}>
                    <Ionicons name="location" size={24} color={Colors.primary} />
                  </View>
                </Marker>
              </MapView>
            </View>
          ) : (
            <Text style={styles.sectionText}>{overviewData?.header?.location}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={handleGetDirections}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={20} color={Colors.text} />
            <Text style={styles.directionsText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Contact */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Contact</Text>
        {overviewData?.header?.phone && (
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color={Colors.info} />
            <Text style={styles.contactButtonText}>Call {overviewData.header.phone}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleChat}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={styles.contactButtonText}>Message on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: Spacing.lg,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginHorizontal: Spacing.xs,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  hourDay: {
    ...Typography.body,
    color: Colors.text,
  },
  hourTime: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  mapContainer: {
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  map: {
    flex: 1,
  },
  mapMarker: {
    backgroundColor: Colors.background,
    padding: 4,
    borderRadius: BorderRadius.round,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  directionsText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 14,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  contactButtonText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
});

export default InfoTab;