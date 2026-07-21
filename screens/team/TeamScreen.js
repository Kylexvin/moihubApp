// screens/team/TeamScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width } = Dimensions.get('window');

const TeamScreen = () => {
  const navigation = useNavigation();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/api/admin/team');
      if (response.data.success) {
        setTeamMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamMembers();
  };

  const getAvatarSource = (imageUrl) => {
    if (imageUrl && imageUrl !== '') {
      return { uri: imageUrl };
    }
    return require('../../assets/moihublogo.png');
  };

  const renderSocialIcon = (url, iconName, color) => {
    if (!url || url === '') return null;
    return (
      <TouchableOpacity 
        style={styles.socialButton}
        onPress={() => Linking.openURL(url)}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={16} color={color} />
      </TouchableOpacity>
    );
  };

  // Separate founders and team members
  const founders = teamMembers.filter(m => 
    m.role?.toLowerCase().includes('founder') || 
    m.role?.toLowerCase().includes('co-founder')
  );
  const otherMembers = teamMembers.filter(m => 
    !m.role?.toLowerCase().includes('founder') && 
    !m.role?.toLowerCase().includes('co-founder')
  );

  const renderMemberCard = (member, isFounder = false) => (
    <View key={member._id} style={[styles.memberCard, isFounder && styles.founderCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={getAvatarSource(member.image)} 
            style={styles.avatar} 
            resizeMode="cover"
          />
          {isFounder && (
            <View style={styles.crownBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
            </View>
          )}
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.memberName}>{member.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.memberRole}>{member.role}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.memberBio}>{member.bio}</Text>
      
      <View style={styles.socialLinks}>
        {renderSocialIcon(member.socials?.github, 'logo-github', '#333')}
        {renderSocialIcon(member.socials?.linkedin, 'logo-linkedin', '#0077B5')}
        {renderSocialIcon(member.socials?.whatsapp, 'logo-whatsapp', '#25D366')}
        {renderSocialIcon(member.socials?.instagram, 'logo-instagram', '#E4405F')}
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => Linking.openURL(`mailto:${member.email || 'support@moihub.com'}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-outline" size={16} color="#01604c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar backgroundColor="#01604c" barStyle="light-content" />
        <ActivityIndicator size="large" color="#01604c" />
        <Text style={styles.loadingText}>Loading team...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#01604c" barStyle="light-content" />
      
 

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#01604c', '#0a7a62']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <Ionicons name="people" size={40} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Meet the Team</Text>
          <Text style={styles.heroSubtitle}>
            Passionate students building the future of campus life
          </Text>
        </LinearGradient>

        {/* Founders Section */}
        {founders.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Founders</Text>
              <View style={styles.sectionLine} />
            </View>
            {founders.map((member) => renderMemberCard(member, true))}
          </View>
        )}

        {/* Team Members Section */}
        {otherMembers.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team</Text>
              <View style={styles.sectionLine} />
            </View>
            {otherMembers.map((member) => renderMemberCard(member, false))}
          </View>
        )}

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No team members yet</Text>
          </View>
        )}

        {/* Join Section */}
        <View style={styles.joinSection}>
          <Text style={styles.joinTitle}>Join the Team</Text>
          <Text style={styles.joinText}>
            We're always looking for passionate students to help build MoiHub.
            Reach out and be part of something great!
          </Text>
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={() => {
              Linking.openURL('https://wa.me/254768610613');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.joinButtonText}>Contact on WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#01604c',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#01604c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#01604c',
    marginLeft: 12,
    opacity: 0.2,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  founderCard: {
    borderWidth: 1,
    borderColor: '#01604c',
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E8',
  },
  crownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  roleBadge: {
    backgroundColor: 'rgba(1,96,76,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#01604c',
    fontWeight: '500',
  },
  memberBio: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 6,
  },
  socialButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  joinText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#25D366',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  footerSpacer: {
    height: 40,
  },
});

export default TeamScreen;