import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const HomescreenManagement = () => {
  const [data, setData] = useState(null);
  const navigation = useNavigation();

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/homescreen');
      setData(res.data);
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navCards = [
    { title: "Mission", route: "MissionScreen", color: "#6366F1" },
    { title: "Highlight", route: "HighlightScreen", color: "#EC4899" },
    { title: "Vendor", route: "VendorScreen", color: "#10B981" },
    { title: "Ads", route: "AdsScreen", color: "#F59E0B" },
  ];

  const handleLink = (url) => {
    if (url) Linking.openURL(url).catch(console.error);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your content</Text>
      </View>

      {/* Navigation Cards */}
      <View style={styles.cardGrid}>
        {navCards.map(({ title, route, color }) => (
          <TouchableOpacity
            key={title}
            style={[styles.navCard, { backgroundColor: color }]}
            onPress={() => navigation.navigate(route)}
            activeOpacity={0.8}
          >
            <Text style={styles.navText}>{title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Sections */}
      <View style={styles.contentWrapper}>
        {data && (
          <>
            {/* Mission Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{data.todaysMission.title}</Text>
                <View style={styles.sectionDivider} />
              </View>
              <Text style={styles.sectionText}>{data.todaysMission.content}</Text>
            </View>


          </>
        )}
      </View>
    </ScrollView>
  );
};

export default HomescreenManagement;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  navCard: {
    width: '48%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  navText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    width: 40,
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  adCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  adContent: {
    gap: 8,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  adCaption: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  adCtaButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  adCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});