import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';
const CARD_HEIGHT = height * 0.62;

const SwipeFeed = ({ navigation }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [showBioSheet, setShowBioSheet] = useState(false);
  const { token, isAuthenticated } = useAuth();

  // Stable animation refs
  const pan = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const passOpacity = useRef(new Animated.Value(0)).current;
  const bioSheetAnim = useRef(new Animated.Value(0)).current;
  const matchSoundRef = useRef(null);
  const isSwiping = useRef(false);

  // Closure-safe refs
  const candidatesRef = useRef(candidates);
  const currentIndexRef = useRef(currentIndex);
  const hasMoreRef = useRef(hasMore);
  const offsetRef = useRef(offset);
  const showBioSheetRef = useRef(showBioSheet);
  useEffect(() => { candidatesRef.current = candidates; }, [candidates]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { showBioSheetRef.current = showBioSheet; }, [showBioSheet]);

  useEffect(() => {
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
    return () => { matchSoundRef.current?.unloadAsync(); };
  }, []);

  const playMatchSound = async () => {
    try { await matchSoundRef.current?.replayAsync(); } catch (e) {}
  };

const fetchFeed = async (refresh = false) => {
  try {
    if (!isAuthenticated || !token) { 
      navigation.replace('Auth'); 
      return; 
    }
    
    const currentOffset = refresh ? 0 : offsetRef.current;
    if (refresh) { 
      setLoading(true); 
      setOffset(0); 
    }
    setError(null);

    console.log('Fetching feed with offset:', currentOffset); // Debug log

    const response = await axios.get(`${API_URL}/linkme/feed`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { offset: currentOffset, limit: 10 },
      timeout: 10000,
    });

    console.log('API Response:', response.data); // Debug log

    const { candidates: newCandidates, hasMore: moreAvailable, nextOffset } = response.data.data;

    console.log('New candidates:', newCandidates?.length); // Debug log
    console.log('Has more:', moreAvailable); // Debug log

    if (refresh) {
      // Filter out any duplicates
      const unique = newCandidates.filter((c, i, self) => i === self.findIndex(x => x._id === c._id));
      setCandidates(unique);
      setCurrentIndex(0);
    } else {
      setCandidates(prev => {
        const existingIds = new Set(prev.map(c => c._id));
        const filtered = newCandidates.filter(c => !existingIds.has(c._id));
        return [...prev, ...filtered];
      });
    }
    
    setHasMore(moreAvailable);
    setOffset(nextOffset);
  } catch (err) {
    console.error('Fetch error:', err); // Debug log
    if (err.response?.status === 401) { 
      navigation.replace('Auth'); 
    } else { 
      setError(err.response?.data?.message || err.message || 'Failed to load feed'); 
    }
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(
    useCallback(() => { fetchFeed(true); }, [token, isAuthenticated])
  );

  const resetCardPosition = () => {
    pan.setValue({ x: 0, y: 0 });
    cardOpacity.setValue(1);
    likeOpacity.setValue(0);
    passOpacity.setValue(0);
  };

  const closeBioSheet = () => {
    setShowBioSheet(false);
    bioSheetAnim.setValue(0);
  };

const advanceCard = useCallback((nextIndex) => {
  isSwiping.current = false;
  resetCardPosition();
  closeBioSheet();
  setCurrentIndex(nextIndex);
  
  // Check if we need to fetch more cards
  if (nextIndex >= candidatesRef.current.length - 1 && hasMoreRef.current) {
    fetchFeed(false);
  }
}, []);

const handleSwipeAPI = async (candidateUserId, direction, nextIndex) => {
  try {
    const response = await axios.post(
      `${API_URL}/linkme/swipe`,
      { swipedUserId: candidateUserId, direction },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const { isMatch, match } = response.data.data;
    if (isMatch && match) {
      playMatchSound();
      Alert.alert(
        "💖 It's a Match!",
        `You and ${match.user.displayName} liked each other!`,
        [
          { text: 'Keep Swiping', style: 'cancel' },
          { text: 'Send Message', onPress: () => navigation.navigate('Messages') },
        ]
      );
    }
    
    // Only advance if we're not at the end
    if (nextIndex <= candidatesRef.current.length) {
      advanceCard(nextIndex);
    }
  } catch (err) {
    Alert.alert('Oops!', 'Failed to process swipe. Please try again.');
    // Reset card position on error
    resetCardPosition();
  }
};

  const animateSwipe = (direction) => {
    const idx = currentIndexRef.current;
    const cands = candidatesRef.current;
    if (isSwiping.current || !cands[idx]) return;
    isSwiping.current = true;

    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: direction === 'right' ? width * 1.4 : -width * 1.4, y: 0 },
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => { handleSwipeAPI(cands[idx].userId, direction, idx + 1); });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => {
      if (!isSwiping.current && (Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10)) {
        // Auto-close bio sheet the moment a swipe gesture starts
        if (showBioSheetRef.current) {
          setShowBioSheet(false);
          bioSheetAnim.setValue(0);
        }
        return true;
      }
      return false;
    },
    onPanResponderMove: (_, g) => {
      pan.setValue({ x: g.dx, y: g.dy * 0.3 });
      const ratio = Math.min(Math.abs(g.dx) / (width * 0.25), 1);
      if (g.dx > 20) { likeOpacity.setValue(ratio); passOpacity.setValue(0); }
      else if (g.dx < -20) { passOpacity.setValue(ratio); likeOpacity.setValue(0); }
      else { likeOpacity.setValue(0); passOpacity.setValue(0); }
    },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > width * 0.3 || Math.abs(g.vx) > 0.8) {
        animateSwipe(g.dx > 0 ? 'right' : 'left');
      } else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start();
        Animated.timing(likeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        Animated.timing(passOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
    },
  });

  const toggleBioSheet = () => {
    const next = !showBioSheet;
    setShowBioSheet(next);
    Animated.spring(bioSheetAnim, { toValue: next ? 1 : 0, useNativeDriver: true, friction: 8 }).start();
  };

  const handleReportUser = async (reason) => {
    const cands = candidatesRef.current;
    const idx = currentIndexRef.current;
    if (!cands[idx]) return;
    setReportLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/linkme/report`,
        { reportedUserId: cands[idx].userId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
        setShowReportModal(false);
        advanceCard(idx + 1);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReportLoading(false);
    }
  };

const renderCards = () => {
  const remainingCandidates = candidates.slice(currentIndex);
  const cardsToShow = Math.min(3, remainingCandidates.length);
  
  return remainingCandidates.slice(0, cardsToShow).map((candidate, stackIndex) => {
    const isTop = stackIndex === 0;
    
    // Only apply pan responder and animations to top card
    const rotate = isTop ? pan.x.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ['-12deg', '0deg', '12deg'],
    }) : '0deg';

    const cardStyle = isTop
      ? { 
          transform: [...pan.getTranslateTransform(), { rotate }], 
          opacity: cardOpacity, 
          zIndex: 10 
        }
      : {
          transform: [
            { scale: stackIndex === 1 ? 0.96 : 0.92 }, 
            { translateY: stackIndex * 8 }
          ],
          opacity: stackIndex === 1 ? 0.85 : 0.6,
          zIndex: 10 - stackIndex,
        };

    return (
      <Animated.View
        key={`${candidate._id}-${currentIndex + stackIndex}`}
        style={[styles.card, cardStyle]}
        {...(isTop ? panResponder.panHandlers : {})}
      >
        <Image source={{ uri: candidate.profilePhotoUrl }} style={styles.cardImage} resizeMode="cover" />

        {isTop && (
          <>
            <Animated.View style={[styles.overlayBadge, styles.likeBadge, { opacity: likeOpacity }]}>
              <Text style={styles.badgeText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.overlayBadge, styles.passBadge, { opacity: passOpacity }]}>
              <Text style={styles.badgeText}>NOPE</Text>
            </Animated.View>
          </>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName}>{candidate.displayName}</Text>
              <Text style={styles.cardAge}>{candidate.age}</Text>
            </View>
            {isTop && (
              <TouchableOpacity style={styles.infoBtn} onPress={toggleBioSheet} activeOpacity={0.8}>
                <Icon name={showBioSheet ? 'chevron-down' : 'information-circle'} size={26} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {isTop && (
          <Animated.View
            style={[
              styles.bioSheet,
              {
                transform: [{
                  translateY: bioSheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [CARD_HEIGHT * 0.6, 0],
                  }),
                }],
              },
            ]}
          >
            <TouchableOpacity onPress={toggleBioSheet} style={styles.bioHandle}>
              <View style={styles.handleBar} />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.bioScroll}>
              <Text style={styles.bioName}>{candidate.displayName}, {candidate.age}</Text>
              <Text style={styles.bioText}>{candidate.bio}</Text>
              {candidate.interests?.length > 0 && (
                <>
                  <Text style={styles.interestTitle}>Interests</Text>
                  <View style={styles.interestRow}>
                    {candidate.interests.map((item, i) => (
                      <View key={i} style={styles.interestChip}>
                        <Text style={styles.interestText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        )}
      </Animated.View>
    );
  });
};

// Screen states
if (loading) {
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.centered}>
      <ActivityIndicator size="large" color="#C44569" />
      <Text style={styles.loadingText}>Finding amazing people for you...</Text>
    </LinearGradient>
  );
}

// Handle error state
if (error) {
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.centered}>
      <Icon name="heart-dislike" size={64} color="#FF6B9D" />
      <Text style={styles.stateTitle}>Something went wrong</Text>
      <Text style={styles.stateMessage}>{error}</Text>
      <TouchableOpacity onPress={() => fetchFeed(true)}>
        <LinearGradient colors={['#C44569', '#FF6B9D']} style={styles.stateBtn}>
          <Text style={styles.stateBtnText}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

// Handle empty state - NO PROFILES AVAILABLE
if (candidates.length === 0) {
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.centered}>
      <Icon name="people-outline" size={80} color="#7b20a1" />
      <Text style={styles.stateTitle}>No profiles available</Text>              
    </LinearGradient>
  );
}

// Handle end of cards (but we have some candidates)
if (currentIndex >= candidates.length) {
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.centered}>
      <Icon name="search" size={64} color="#7b20a1" />
      <Text style={styles.stateTitle}>You're all caught up!</Text>
      <Text style={styles.stateMessage}>
        You've seen everyone available right now.{'\n'}
        New people join every day!
      </Text>
      <TouchableOpacity onPress={() => fetchFeed(true)}>
        <LinearGradient colors={['#5F27CD', '#7B20A1']} style={styles.stateBtn}>
          <Text style={styles.stateBtnText}>Check for New People</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.screen}>
      {/* Fixed card stack */}
      <View style={styles.cardStack}>
        {renderCards()}
      </View>

      {/* Bottom section — centered in remaining space */}
      <View style={styles.bottomSection}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => animateSwipe('left')} activeOpacity={0.85}>
            <Icon name="close" size={30} color="#FF4757" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.superBtn]} onPress={() => {}} activeOpacity={0.85}>
            <Icon name="star" size={22} color="#5F27CD" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => animateSwipe('right')} activeOpacity={0.85}>
            <Icon name="heart" size={30} color="#FF6B9D" />
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => setShowReportModal(true)}>
            <Icon name="flag-outline" size={16} color="#aaa" />
            <Text style={styles.footerBtnText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerBtn} onPress={() => {}}>
            <Icon name="ban-outline" size={16} color="#aaa" />
            <Text style={styles.footerBtnText}>Block</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Report modal */}
      <Modal visible={showReportModal} animationType="slide" transparent onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report User</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Why are you reporting this user?</Text>
            {[
              { key: 'inappropriate_content', label: 'Inappropriate Content' },
              { key: 'harassment', label: 'Harassment' },
              { key: 'spam', label: 'Spam' },
              { key: 'fake_profile', label: 'Fake Profile' },
              { key: 'underage', label: 'Underage User' },
              { key: 'other', label: 'Other' },
            ].map(opt => (
              <TouchableOpacity key={opt.key} style={styles.reportOption} onPress={() => handleReportUser(opt.key)} disabled={reportLoading}>
                <Text style={styles.reportOptionText}>{opt.label}</Text>
                <Icon name="chevron-forward" size={18} color="#C44569" />
              </TouchableOpacity>
            ))}
            {reportLoading && <ActivityIndicator color="#C44569" style={{ marginTop: 16 }} />}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 85,
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // Card stack
  cardStack: {
    height: CARD_HEIGHT,
    marginTop: 16,
    marginHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'absolute',
    backgroundColor: '#2D2D3A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  cardName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  cardAge: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
  },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Like / Pass badges
  overlayBadge: {
    position: 'absolute',
    top: 50,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeBadge: {
    left: 20,
    borderColor: '#4CD964',
    backgroundColor: 'rgba(76,217,100,0.15)',
    transform: [{ rotate: '-20deg' }],
  },
  passBadge: {
    right: 20,
    borderColor: '#FF4757',
    backgroundColor: 'rgba(255,71,87,0.15)',
    transform: [{ rotate: '20deg' }],
  },
  badgeText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#fff',
  },

  // Bio sheet
  bioSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.65,
    backgroundColor: 'rgba(18,18,30,0.97)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  bioHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  bioScroll: {
    flex: 1,
  },
  bioName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
    marginBottom: 20,
  },
  interestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(196,69,105,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(196,69,105,0.4)',
  },
  interestText: {
    color: '#FF6B9D',
    fontSize: 13,
    fontWeight: '600',
  },
// Add to your StyleSheet object
emptyStateButtons: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 12,
  marginTop: 20,
  marginBottom: 30,
},
emptyStateButton: {
  flex: 1,
  maxWidth: 150,
},
outlineButton: {
  borderWidth: 2,
  borderColor: '#5F27CD',
  borderRadius: 25,
  paddingVertical: 12,
  paddingHorizontal: 16,
  alignItems: 'center',
  justifyContent: 'center',
},
outlineButtonText: {
  color: '#5F27CD',
  fontSize: 14,
  fontWeight: '600',
},
tipsContainer: {
  marginTop: 20,
  paddingHorizontal: 20,
  width: '100%',
},
tipsTitle: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 12,
  textAlign: 'center',
},
tipItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
  backgroundColor: 'rgba(255,255,255,0.05)',
  padding: 12,
  borderRadius: 12,
},
tipText: {
  color: '#ccc',
  fontSize: 14,
  flex: 1,
},
  // Bottom section
  bottomSection: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    marginBottom: 20,
  },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#1e1e30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  passBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255,71,87,0.35)',
  },
  superBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(95,39,205,0.35)',
  },
  likeBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255,107,157,0.35)',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  footerBtnText: {
    color: '#aaa',
    fontSize: 13,
  },

  // Loading / Error / Empty
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  stateBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  stateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  reportOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(196,69,105,0.25)',
  },
  reportOptionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default SwipeFeed;   