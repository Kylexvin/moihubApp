import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';

const { width } = Dimensions.get('window');

const MusomiScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Programming', 'Business', 'Design', 'Science'];

  const courses = [
    {
      title: 'Introduction to React Native',
      instructor: 'Dr. Jane Smith',
      duration: '6 weeks',
      level: 'Beginner',
      category: 'Programming',
      progress: 65,
      students: 124,
      rating: 4.8,
      color: '#DBEAFE'
    },
    {
      title: 'Business Analytics',
      instructor: 'Prof. John Doe',
      duration: '8 weeks',
      level: 'Intermediate',
      category: 'Business',
      progress: 0,
      students: 89,
      rating: 4.6,
      color: '#D1FAE5'
    },
    {
      title: 'UI/UX Design Fundamentals',
      instructor: 'Sarah Wilson',
      duration: '10 weeks',
      level: 'Beginner',
      category: 'Design',
      progress: 30,
      students: 156,
      rating: 4.9,
      color: '#FEF3C7'
    },
    {
      title: 'Data Structures & Algorithms',
      instructor: 'Dr. Mike Johnson',
      duration: '12 weeks',
      level: 'Advanced',
      category: 'Programming',
      progress: 45,
      students: 78,
      rating: 4.7,
      color: '#FCE7F3'
    },
    {
      title: 'Environmental Science',
      instructor: 'Dr. Lisa Brown',
      duration: '6 weeks',
      level: 'Intermediate',
      category: 'Science',
      progress: 0,
      students: 203,
      rating: 4.5,
      color: '#E0E7FF'
    }
  ];

  const achievements = [
    { name: 'Quick Learner', icon: '⚡', earned: true },
    { name: 'Course Completionist', icon: '🏆', earned: true },
    { name: 'Active Participant', icon: '💬', earned: false },
    { name: 'Top Performer', icon: '⭐', earned: false }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search courses..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Text style={styles.searchIcon}>🔍</Text>
    </View>
  );

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.activeCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>5</Text>
        <Text style={styles.statLabel}>Enrolled Courses</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>2</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>35h</Text>
        <Text style={styles.statLabel}>Learning Time</Text>
      </View>
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsContainer}>
        {achievements.map((achievement, index) => (
          <View
            key={index}
            style={[
              styles.achievementBadge,
              achievement.earned && styles.earnedBadge
            ]}
          >
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <Text style={[
              styles.achievementText,
              achievement.earned && styles.earnedText
            ]}>
              {achievement.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Musomi E-Learning</Text>
        <Text style={styles.headerSubtitle}>Expand your knowledge</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSearchBar()}
        {renderStats()}
        {renderCategoryTabs()}
        {renderAchievements()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Courses</Text>
          {filteredCourses.map((course, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.courseCard, { backgroundColor: course.color }]}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseInstructor}>by {course.instructor}</Text>
                </View>
                <View style={[
                  styles.levelBadge,
                  { backgroundColor: getLevelColor(course.level) }
                ]}>
                  <Text style={styles.levelText}>{course.level}</Text>
                </View>
              </View>

              <View style={styles.courseDetails}>
                <Text style={styles.courseDuration}>📅 {course.duration}</Text>
                <Text style={styles.courseStudents}>👥 {course.students} students</Text>
                <Text style={styles.courseRating}>⭐ {course.rating}</Text>
              </View>

              {course.progress > 0 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>Progress: {course.progress}%</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${course.progress}%` }
                      ]}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.courseButton}>
                <Text style={styles.courseButtonText}>
                  {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeCategoryTab: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementBadge: {
    width: (width - 84) / 2,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
    opacity: 0.5,
  },
  earnedBadge: {
    backgroundColor: '#FEF3C7',
    opacity: 1,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  earnedText: {
    color: '#92400E',
  },
  courseCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#64748B',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  courseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  courseDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  courseStudents: {
    fontSize: 12,
    color: '#64748B',
  },
  courseRating: {
    fontSize: 12,
    color: '#64748B',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  courseButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  courseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MusomiScreen;