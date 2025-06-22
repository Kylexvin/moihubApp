import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Image,
  StatusBar,
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef(null);

  // Slideshow data - can be replaced with API data
  const slideData = [
    {
      id: 1,
      title: "Welcome to MoiHub",
      subtitle: "Your campus companion for everything you need",
      // image: require('../assets/moihublogo.png'),
      backgroundColor: '#2C5F2D',
      buttonText: "Get Started",
      buttonAction: () => navigation.navigate('Services')
    },
    {
      id: 2,
      title: "Fast Food Delivery",
      subtitle: "Delicious meals delivered to your doorstep in minutes",
      image: require('../assets/image.jpg'),
      backgroundColor: '#1976D2',
      buttonText: "Order Now",
      buttonAction: () => navigation.navigate('FoodStack', { screen: 'FoodHome' })
    },
    {
      id: 3,
      title: "Room Bookings",
      subtitle: "Find and book your perfect accommodation",
      image: require('../assets/image.jpg'),
      backgroundColor: '#7B1FA2',
      buttonText: "Browse Rooms",
      buttonAction: () => navigation.navigate('AccomStack', { screen: 'RentalHome' })
    },
   {
  id: 4,
  title: "LinkMe Dating",
  subtitle: "Find real connections within Moi University",
  image: require('../assets/linkmelogo.png'), // Replace with actual image
  backgroundColor: '#FF4081',
  buttonText: "Get Started",
  buttonAction: () => navigation.navigate('LinkMe',{ screen: 'LinkMeEntry' } )
}

  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % slideData.length;
        slideRef.current?.scrollToIndex({ 
          index: nextSlide, 
          animated: true 
        });
        return nextSlide;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [slideData.length]);

  const handleSlideChange = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    slideRef.current?.scrollToIndex({ 
      index, 
      animated: true 
    });
  };

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
    onPress: () => navigation.navigate('Services', { screen: 'EmergencyServices' })
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
    { title: "Website Development", price: "Ksh 20000", image: require('../assets/web.jpg') },    
    { title: "Graphic Design", price: "Ksh 350", image: require('../assets/graphicd.jpg') },
    { title: "Bluespeed Home Internet", price: "5MPS Ksh 1500 /M", image: require('../assets/internet.jpg') }
  ];



  const foodSpots = [
    { name: "Campus Café", rating: "4.5", distance: "5 min walk", image: require('../assets/image.jpg') },
    { name: "Moi Bistro", rating: "4.8", distance: "10 min walk", image: require('../assets/image.jpg') },
    { name: "Green Corner", rating: "4.2", distance: "7 min walk", image: require('../assets/image.jpg') }
  ];

  const renderSlideItem = ({ item }) => (
    <View style={[styles.slideItem, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.slideContent}>
        <View style={styles.slideTextContainer}>
          <Animatable.Text 
            animation={fadeInDown} 
            duration={1200} 
            style={styles.slideTitle}
          >
            {item.title}
          </Animatable.Text>
          <Animatable.Text 
            animation={fadeInDown}
            duration={1200}
            delay={300}
            style={styles.slideSubtitle}
          >
            {item.subtitle}
          </Animatable.Text>
          <TouchableOpacity
            style={styles.slideButton}
            onPress={item.buttonAction}
          >
            <Text style={styles.slideButtonText}>{item.buttonText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.slideImageContainer}>
          <Image
            source={item.image}
            style={styles.slideImage}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#02604c" barStyle="light-content" />
       <LinearGradient
        colors={['#083028','#0a0a0a',  '#0a0a0a']}
        style={styles.background}
      />
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
            <Ionicons name="person-circle-outline" size={32} color="#2C5F2D" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Interactive Slideshow */}
        <View style={styles.slideshowContainer}>
          <FlatList
            ref={slideRef}
            data={slideData}
            renderItem={renderSlideItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleSlideChange}
            getItemLayout={(data, index) => ({
              length: width - 40,
              offset: (width - 40) * index,
              index,
            })}
          />
          
          {/* Slide Indicators */}
          <View style={styles.indicatorContainer}>
            {slideData.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: currentSlide === index ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }
                ]}
                onPress={() => goToSlide(index)}
              />
            ))}
          </View>
        </View>

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
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                  <Text style={styles.cardPrice}>{service.price}</Text>
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
              <Text style={styles.footerLink}>Policy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerCopyright}>Made by Kylex</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ivory', 
  },
  header: {
    backgroundColor: 'ivory',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    color: '#01604b',
  },
  greeting: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  profileButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 5,
  },
  
  // Slideshow Styles
  slideshowContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  slideItem: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  slideContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  slideTextContainer: {
    flex: 1,
    paddingRight: 15,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
    lineHeight: 20,
  },
  slideButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  slideButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  slideImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
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
    color: '#000',
  },
  horizontalScrollView: {
    paddingBottom: 16,
  },
  serviceCard: {
    width: 160,
    backgroundColor: '#01604c',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  roomCard: {
    width: 200,
    backgroundColor: '#01604c',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  foodCard: {
    width: 160,
    backgroundColor: '#01604c',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    backgroundColor: '#2C5F2D',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#BDC3C7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionContainer: {
    backgroundColor: '#3E4651',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  suggestionText: {
    fontSize: 12,
    color: '#BDC3C7',
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
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  footerDivider: {
    fontSize: 12,
    color: '#7F8C8D',
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 2,
  },
  footerCopyright: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 6,
  },
});

export default HomeScreen;