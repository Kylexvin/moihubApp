import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  RefreshControl,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';

const SwipeFeed = ({ navigation }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(0)).current;
  const passScale = useRef(new Animated.Value(0)).current;
  const matchSoundRef = useRef(null);

  useEffect(() => {
    // Preload sound
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/moihub_sound.mp3')
        );
        matchSoundRef.current = sound;
      } catch (err) {
        console.error('Failed to load match sound:', err);
      }
    };

    loadSound();

    return () => {
      // Cleanup
      if (matchSoundRef.current) {
        matchSoundRef.current.unloadAsync();
      }
    };
  }, []);

  const playMatchSound = async () => {
    try {
      if (matchSoundRef.current) {
        await matchSoundRef.current.replayAsync();
      }
    } catch (err) {
      console.error('Error playing match sound:', err);
    }
  };

  const fetchFeed = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setOffset(0);
      } else {
        setLoading(true);
      }
      
      setError(null);

      if (!isAuthenticated || !token) {
        navigation.replace('Auth');
        return;
      }

      console.log('Fetching feed data...');
      const response = await axios.get(`${API_URL}/linkme/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          offset: refresh ? 0 : offset,
          limit: 10
        },
        timeout: 10000,
      });

      const { candidates: newCandidates, hasMore: moreAvailable, nextOffset } = response.data.data;
      
      if (refresh) {
        const uniqueCandidates = newCandidates.filter((candidate, index, self) => 
          index === self.findIndex(c => c._id === candidate._id)
        );
        setCandidates(uniqueCandidates);
        setCurrentIndex(0);
      } else {
        setCandidates(prev => {
          const existingIds = new Set(prev.map(c => c._id));
          const filteredNew = newCandidates.filter(c => !existingIds.has(c._id));
          return [...prev, ...filteredNew];
        });
      }
      
      setHasMore(moreAvailable);
      setOffset(nextOffset);

      // Animate card entrance
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (err) {
      console.error('Error fetching feed:', err);
      
      if (err.response?.status === 401) {
        navigation.replace('Auth');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load feed');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFeed(true);
  };

  const handleSwipe = async (candidateUserId, direction) => {
    try {
      const response = await axios.post(`${API_URL}/linkme/swipe`, 
        { 
          swipedUserId: candidateUserId,
          direction: direction
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { isMatch, match } = response.data.data;
      
      // Move to next candidate
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Check if we need to load more candidates
      if (nextIndex >= candidates.length - 2 && hasMore) {
        fetchFeed(false);
      }
      
      // Reset animations with proper timing
      pan.setValue({ x: 0, y: 0 });
      
      // Only animate if there are more candidates
      if (nextIndex < candidates.length) {
        scale.setValue(0.95);
        opacity.setValue(0);
        likeScale.setValue(0);
        passScale.setValue(0);
        
        // Animate next card entrance
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }, 100);
      }

      // Handle match notification
      if (isMatch && match) {
        playMatchSound();
        Alert.alert(
          '💖 It\'s a Match!', 
          `You and ${match.user.displayName} liked each other!`,
          [
            { text: 'Keep Swiping', style: 'default' },
            { text: 'Send Message', style: 'default', onPress: () => {
              navigation.navigate('Messages');
            }}
          ]
        );
      }
      
    } catch (err) {
      console.error('Error swiping:', err);
      setCurrentIndex(prev => Math.max(0, prev - 1));
      Alert.alert('Oops!', 'Failed to process swipe. Please try again.');
    }
  };

  const handleReportUser = async (reason, details = '') => {
    if (!candidates[currentIndex]) return;

    setReportLoading(true);
    try {
      const response = await axios.post(`${API_URL}/linkme/report`, {
        reportedUserId: candidates[currentIndex].userId,
        reason,
        details
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
        setShowReportModal(false);
        // Move to next candidate after reporting
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
      }
    } catch (err) {
      console.error('Error reporting user:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReportLoading(false);
    }
  };

  const animateSwipe = (direction) => {
    const toValue = direction === 'right' ? width + 100 : -width - 100;
    
    // Animate the appropriate emotion
    const emotionScale = direction === 'right' ? likeScale : passScale;
    Animated.timing(emotionScale, {
      toValue: 1.5,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(pan, {
      toValue: { x: toValue, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (candidates[currentIndex]) {
        handleSwipe(candidates[currentIndex].userId, direction);
      }
    });
  };

  const handleLike = () => {
    animateSwipe('right');
  };

  const handlePass = () => {
    animateSwipe('left');
  };

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      
      // Animate emotions based on swipe direction
      if (gestureState.dx > 50) {
        Animated.timing(likeScale, {
          toValue: Math.min(gestureState.dx / 100, 1),
          duration: 0,
          useNativeDriver: true,
        }).start();
        Animated.timing(passScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }).start();
      } else if (gestureState.dx < -50) {
        Animated.timing(passScale, {
          toValue: Math.min(Math.abs(gestureState.dx) / 100, 1),
          duration: 0,
          useNativeDriver: true,
        }).start();
        Animated.timing(likeScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(likeScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }).start();
        Animated.timing(passScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }).start();
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (Math.abs(gestureState.dx) > width * 0.25) {
        const direction = gestureState.dx > 0 ? 'right' : 'left';
        animateSwipe(direction);
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
        
        // Reset emotion scales
        Animated.timing(likeScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        Animated.timing(passScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchFeed();
    }, [token, isAuthenticated])
  );

  const renderCard = (candidate, index) => {
    if (index < currentIndex) return null;
    
    const isTopCard = index === currentIndex;
    const cardScale = isTopCard ? scale : new Animated.Value(0.95);
    const cardOpacity = isTopCard ? opacity : new Animated.Value(0.8);
    
    const rotate = pan.x.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
    });

    return (
      <Animated.View
        key={`${candidate._id}-${index}`}
        style={[
          styles.card,
          {
            transform: [
              ...pan.getTranslateTransform(),
              { rotate: isTopCard ? rotate : '0deg' },
              { scale: cardScale },
            ],
            opacity: cardOpacity,
            zIndex: candidates.length - index,
          }
        ]}
        {...(isTopCard ? panResponder.panHandlers : {})}
      >
        <View style={styles.cardInner}>
          <Image 
            source={{ uri: candidate.profilePhotoUrl }} 
            style={styles.profileImage}
            resizeMode="cover"
          />
          
          {/* Emotion overlays */}
          {isTopCard && (
            <>
              <Animated.View style={[styles.emotionOverlay, { transform: [{ scale: likeScale }] }]}>
                <View style={styles.likeEmotion}>
                  <Icon name="heart" size={80} color="#FF6B9D" />
                  <Text style={styles.emotionText}>💖</Text>
                </View>
              </Animated.View>
              
              <Animated.View style={[styles.emotionOverlay, { transform: [{ scale: passScale }] }]}>
                <View style={styles.passEmotion}>
                  <Icon name="close-circle" size={80} color="#FF4757" />
                  <Text style={styles.emotionText}>😔</Text>
                </View>
              </Animated.View>
            </>
          )}
          
          {/* Bottom info section */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
            style={styles.infoSection}
          >
            <View style={styles.nameAgeContainer}>
              <Text style={styles.displayName}>{candidate.displayName}</Text>
              <Text style={styles.age}>{candidate.age}</Text>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  const renderUserDetails = () => {
    const candidate = candidates[currentIndex];
    if (!candidate) return null;

    return (
      <View style={styles.userDetailsContainer}>
        <View style={styles.userDetailsHeader}>
          <Text style={styles.userDetailsTitle}>About {candidate.displayName}</Text>
        </View>
        
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>{candidate.bio}</Text>
        </View>
        
        <View style={styles.interestsSection}>
          <Text style={styles.interestsTitle}>Interests</Text>
          <View style={styles.interestsGrid}>
            {candidate.interests.map((interest, idx) => (
              <View key={`${candidate._id}-interest-${idx}`} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.passButton]}
        onPress={handlePass}
      >
        <LinearGradient
          colors={['#FF4757', '#FF3742']}
          style={styles.actionButtonGradient}
        >
          <Icon name="close" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.superLikeButton]}
        onPress={() => {/* Implement super like */}}
      >
        <LinearGradient
          colors={['#5F27CD', '#7B20A1']}
          style={styles.actionButtonGradient}
        >
          <Icon name="star" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.likeButton]}
        onPress={handleLike}
      >
        <LinearGradient
          colors={['#FF6B9D', '#C44569']}
          style={styles.actionButtonGradient}
        >
          <Icon name="heart" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFooterActions = () => (
    <View style={styles.footerActions}>
      <TouchableOpacity 
        style={styles.footerActionButton}
        onPress={() => setShowReportModal(true)}
      >
        <Icon name="flag" size={20} color="#FF6B9D" />
        <Text style={styles.footerActionText}>Report User</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.footerActionButton}
        onPress={() => {/* Implement block user */}}
      >
        <Icon name="ban" size={20} color="#FF6B9D" />
        <Text style={styles.footerActionText}>Block User</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportModal = () => (
    <Modal
      visible={showReportModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReportModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report User</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>Why are you reporting this user?</Text>
          
          <View style={styles.reportOptions}>
            {[
              { key: 'inappropriate_content', label: 'Inappropriate Content' },
              { key: 'harassment', label: 'Harassment' },
              { key: 'spam', label: 'Spam' },
              { key: 'fake_profile', label: 'Fake Profile' },
              { key: 'underage', label: 'Underage User' },
              { key: 'other', label: 'Other' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.reportOption}
                onPress={() => handleReportUser(option.key)}
                disabled={reportLoading}
              >
                <Text style={styles.reportOptionText}>{option.label}</Text>
                <Icon name="chevron-forward" size={20} color="#C44569" />
              </TouchableOpacity>
            ))}
          </View>
          
          {reportLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#C44569" />
              <Text style={styles.loadingText}>Submitting report...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && candidates.length === 0) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C44569" />
          <Text style={styles.loadingText}>Finding amazing people for you...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error && candidates.length === 0) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="heart-dislike" size={64} color="#FF6B9D" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <LinearGradient
              colors={['#C44569', '#FF6B9D']}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (currentIndex >= candidates.length) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="search" size={64} color="#7b20a1" />
          <Text style={styles.emptyTitle}>No more profiles!</Text>
          <Text style={styles.emptyMessage}>
            You've seen all available profiles. Check back later for new matches!
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <LinearGradient
              colors={['#5F27CD', '#7B20A1']}
              style={styles.refreshButtonGradient}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#C44569']}
            tintColor="#C44569"
          />
        }
      >
        {/* Cards container */}
        <View style={styles.cardsContainer}>
          {candidates.slice(currentIndex, currentIndex + 3).map((candidate, index) =>
            renderCard(candidate, currentIndex + index)
          )}
        </View>

        {/* Action buttons */}
        {renderActionButtons()}

        {/* User details section */}
        {renderUserDetails()}

        {/* Footer actions */}
        {renderFooterActions()}
      </ScrollView>

      {/* Report modal */}
      {renderReportModal()}
    </LinearGradient>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 85, // Account for bottom tab navigator
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  cardsContainer: {
    minHeight: height * 0.6, // Use minHeight instead of flex: 1
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  card: {
    width: width - 40,
    height: height * 0.5,
    position: 'absolute',
    borderRadius: 25,
    // Neumorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  cardInner: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#2D2D3A',
    // Inner neumorphism
    shadowColor: '#fff',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  profileImage: {
    width: '100%',
    height: '75%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  emotionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  likeEmotion: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderRadius: 100,
    padding: 20,
  },
  passEmotion: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderRadius: 100,
    padding: 20,
  },
  emotionText: {
    fontSize: 40,
    marginTop: 10,
  },
  infoSection: {
    height: '25%',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameAgeContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  age: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  infoButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(167, 39, 206, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    // Neumorphism
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    gap: 25,
  },
  actionButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    // Neumorphism
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {
    transform: [{ scale: 0.9 }],
  },
  superLikeButton: {
    transform: [{ scale: 1.1 }],
  },
  likeButton: {
    transform: [{ scale: 0.9 }],
  },
  bioCard: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#2D2D3A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    // Neumorphism
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  bioCardHandle: {
    width: 50,
    height: 5,
    backgroundColor: '#666',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  bioContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bioTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 25,
  },
  interestsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  interestTag: {
    backgroundColor: 'rgba(196, 69, 105, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(196, 69, 105, 0.3)',
  },
  interestText: {
    color: '#FF6B9D',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  retryButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  refreshButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  refreshButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Fixed scrollable content styles
  scrollContent: {
    flexGrow: 1,
  },
  userDetailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  userDetailsHeader: {
    marginBottom: 15,
  },
  userDetailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bioSection: {
    marginBottom: 20,
  },
  interestsSection: {
    marginBottom: 10,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  footerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  footerActionText: {
    color: '#FF6B9D',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#E8E8E8',
    marginBottom: 20,
    textAlign: 'center',
  },
  reportOptions: {
    gap: 12,
  },
  reportOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 69, 105, 0.3)',
  },
  reportOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SwipeFeed; 