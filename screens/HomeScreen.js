import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Image,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation(); 
  // Animation references
  const fadeInDown = {
    0: {
      opacity: 0,
      translateY: -20,
    },
    1: {
      opacity: 1,
      translateY: 0,
    },
  };

  const serviceCategories = [
    { 
      title: "Emergency", 
      icon: "alert-circle-outline", 
      color: "#EF5350",
      onPress: () => console.log("Emergency pressed")
    },
    { 
      title: "Food Delivery", 
      icon: "fast-food-outline", 
      color: "#42A5F5",
     onPress: () => navigation.navigate('FoodStack', { screen: 'FoodHome' })
    },
    { 
      title: "Boda Boda", 
      icon: "bicycle-outline", 
      color: "#FFB300",
      onPress: () => console.log("Boda Boda pressed")
    }
  ];

  const topServices = [
    { title: "Bluespeed Home Internet", price: "5MPS Ksh 1500 /M", image: require('../assets/internet.jpg') },
    { title: "Graphic Design", price: "Ksh 350", image: require('../assets/graphicd.jpg') },
    { title: "Website Development", price: "Ksh 20000", image: require('../assets/web.jpg') }
  ];

  const availableRooms = [
    { name: "Hostel A - Single", price: "Ksh 15,000", availability: "5 left", image: require('../assets/image.jpg') },
    { name: "Hostel B - Shared", price: "Ksh 10,000", availability: "12 left", image: require('../assets/image.jpg') },
    { name: "Premium Suite", price: "Ksh 25,000", availability: "2 left", image: require('../assets/image.jpg') }
  ];

  const foodSpots = [
    { name: "Campus Café", rating: "4.5", distance: "5 min walk", image: require('../assets/image.jpg') },
    { name: "Moi Bistro", rating: "4.8", distance: "10 min walk", image: require('../assets/image.jpg') },
    { name: "Green Corner", rating: "4.2", distance: "7 min walk", image: require('../assets/image.jpg') }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#005f4b" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
    <View style={styles.headerContent}>

    {/* Left: Logo and Text */}
    <View style={styles.logoTextContainer}>
      <Image
        source={require('../assets/moihublogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View>
        <Text style={styles.appName}>MoiHub</Text>
        <Text style={styles.greeting}>Welcome back, {currentUser?.username || 'Guest'}!</Text>

      </View>
    </View>

    {/* Right: Profile */}
    <TouchableOpacity style={styles.profileButton}>
      <Ionicons name="person-circle-outline" size={32} color="#005f4b" />
    </TouchableOpacity>

  </View>

        
        
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Animatable.View 
          animation="fadeIn" 
          duration={1000} 
          style={styles.heroSection}
        >
          <Animatable.Text 
            animation={fadeInDown} 
            duration={1200} 
            delay={300}
            style={styles.heroTitle}
          >
            Connecting Moi University to Everything
          </Animatable.Text>
          <Animatable.Text 
            animation={fadeInDown}
            duration={1200}
            delay={500}
            style={styles.heroSubtitle}
          >
            Room bookings, deliveries, services & more – all in one place
          </Animatable.Text>
          
  <View style={styles.heroButtons}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Services')}
      >
        <Ionicons name="rocket-outline" size={16} color="#FFF" />
        <Text style={styles.primaryButtonText}>Explore Services</Text>
      </TouchableOpacity>    
    </View>
        </Animatable.View>

        {/* Service Categories */}
        <View style={styles.sectionContainer}>          
          <View style={styles.categoriesContainer}>
            {serviceCategories.map((category, idx) => (
              <Animatable.View 
                key={idx}
                animation="bounceIn"
                delay={300 + (idx * 100)}
                duration={1500}
                style={styles.categoryItem}
              >
                <TouchableOpacity 
                  style={[styles.categoryIcon, { backgroundColor: category.color }]}
                  onPress={category.onPress}
                >
                  <Ionicons name={category.icon} size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.categoryText}>{category.title}</Text>
              </Animatable.View>
            ))}
          </View>
        </View>

        {/* Top Services */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollView}>
            {topServices.map((service, idx) => (
              <TouchableOpacity key={idx} style={styles.serviceCard}>
                <View style={styles.cardImageContainer}>
                  <Image
                    source={service.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.ratingBadge}>                                      
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                  <Text style={styles.cardPrice}>{service.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>


        {/* Available Rooms */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Available Rooms</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollView}>
            {availableRooms.map((room, idx) => (
              <TouchableOpacity key={idx} style={styles.roomCard}>
                <View style={styles.cardImageContainer}>
                  <Image
                    source={room.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.availabilityBadge}>
                    <Text style={styles.availabilityText}>{room.availability}</Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{room.name}</Text>
                  <Text style={styles.cardPrice}>{room.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Top Food Spots */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Food Spots Near You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollView}>
            {foodSpots.map((spot, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.foodCard}
                onPress={() => navigation.navigate('FoodStack')}
              >
                <View style={styles.cardImageContainer}>
                  <Image
                    source={spot.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>{spot.rating}</Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{spot.name}</Text>
                  <Text style={styles.cardSubtext}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    {' ' + spot.distance}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Smart Suggestions */}
        <View style={styles.suggestionContainer}>
          <Ionicons name="bulb-outline" size={20} color="#FFC107" />
          <View style={styles.suggestionContent}>
            <Text style={styles.suggestionTitle}>Smart Suggestion</Text>
            <Text style={styles.suggestionText}>You might need laundry services again today based on your last order.</Text>
          </View>
          <TouchableOpacity style={styles.suggestionButton}>
            <Text style={styles.suggestionButtonText}>Order</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>About</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerCopyright}>Made by Kylex</Text>
        </View>
      </ScrollView>

      {/* Floating Support Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
header: {
  backgroundColor: '#FFFFFF',
  paddingTop: 10,
  paddingBottom: 15,
  paddingHorizontal: 20,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 5,
},

headerContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
},

logoTextContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},

logo: {
  width: 40,
  height: 40,
  borderRadius: 8,
  marginRight: 10,
},

appName: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#005f4b',
},

greeting: {
  fontSize: 14,
  color: '#666',
  marginTop: 2,
},

profileButton: {
  backgroundColor: '#E9F5F2',
  borderRadius: 20,
  padding: 5,
},

  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 2,
  },
  heroSection: {
    backgroundColor: '#005f4b',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#E9F5F2',
    marginBottom: 20,
  },
  heroButtons: {
  flexDirection: 'row',
  justifyContent: 'center', // centers horizontally
  alignItems: 'center',
  marginTop: 20,
},

  primaryButton: {
    backgroundColor: '#FF7043',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#005f4b',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  horizontalScrollView: {
    paddingBottom: 16,
  },
  serviceCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  roomCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  foodCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 100,
  },
  ratingBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 2,
    fontWeight: 'bold',
  },
  availabilityBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: '#005f4b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 12,
    color: '#005f4b',
    fontWeight: 'bold',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealCard: {
    width: 200,
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dealValidity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
  },
  dealCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#005f4b',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyText: {
    fontSize: 12,
    color: '#005f4b',
    marginLeft: 4,
  },
  suggestionContainer: {
    backgroundColor: '#FFFDE7',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  suggestionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  suggestionButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    marginBottom: 100,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#666',
  },
  footerDivider: {
    fontSize: 12,
    color: '#CCC',
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  footerCopyright: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#005f4b',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#005f4b',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
});

export default HomeScreen;