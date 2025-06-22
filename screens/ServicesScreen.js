import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,SafeAreaView,Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
const ServicesScreen = () => {
const navigation = useNavigation();

const { width, height } = Dimensions.get('window');

const services = [
  // University Services
  { 
    title: "My University", 
    icon: "school", 
    category: "uni", 
    color: "#50c878" 
  },

  // Rentals/Accommodation Services
  { 
    title: "Rental Booking", 
    icon: "home", 
    category: "accom", 
    color: "#50c878" 
  },
  { 
    title: "Roommate Finder", 
    icon: "people", 
    category: "accom", 
    color: "#50c878" 
  },
  { 
    title: "Second Hand Items", 
    icon: "pricetag", 
    category: "accom", 
    color: "#50c878" 
  },

  // Food Services
  { 
    title: "Food Delivery", 
    icon: "fast-food", 
    category: "food", 
    color: "#ff7f50" 
  },
 

  // Eshop
  {
    title: "Eshop",
    icon: "bag",
    category: "shop",
    color: "#ffb347"
  },

  // Local Service
  { 
    title: "LinkMe", 
    icon: "heart", 
    category: "local", 
    color: "red" 
  },
{
  title: "Blogs",
  icon: "book",
  category: "local",
  color: "#3498db"
}

];


  // Navigate to specific service screens
  const navigateToServiceScreen = (serviceType) => {
    if (serviceType === 'local') {
      navigation.navigate('LocalServices');
    } else if (serviceType === 'emergency') {
      navigation.navigate('EmergencyServices');
    }
  };

const handleServicePress = (service) => {
  switch (service.title) {
    case 'LinkMe':
      navigation.navigate('LinkMe');
      break;

    case 'Food Delivery':
      navigation.navigate('FoodStack', { screen: 'FoodHome' });
      break;

    case 'Rental Booking':
      navigation.navigate('AccomStack', { screen: 'RentalHome' });
      break;

    case 'Roommate Finder':
      navigation.navigate('RoommateStack', { screen: 'RoommateBrowse' });
      break;

    case 'Second Hand Items':
      navigation.navigate('SecondHandStack', { screen: 'SecondHandHome' });
      break;

    case 'My University':
      navigation.navigate('MySchoolNavigator', { screen: 'MySchoolHome' });
      break;

    case 'Eshop':
      navigation.navigate('EshopNavigator');
      break;

    case 'Blogs':
      navigation.navigate('BlogsNavigator');
      break;

    default:
      if (service.category === 'local') {
        navigation.navigate('LocalServices');
      } else {
        console.log(`${service.title} pressed, category: ${service.category}`);
      }
  }
};




  // Featured services section
  const FeaturedServices = () => {
    return (
      <View style={styles.featuredContainer}>
        <Text style={styles.featuredItemTitle}>Featured</Text>
        <View style={styles.featuredGrid}>
          {/* Emergency Services */}
          <TouchableOpacity 
            style={styles.featuredItem}
            onPress={() => navigateToServiceScreen('emergency')}
          >
            <View style={[styles.featuredIconContainer, { backgroundColor: '#e74c3c20' }]}>
              <Ionicons name="alert-circle" size={40} color="#e74c3c" />
            </View>
            <Text style={styles.featuredItemTitle}>Emergency</Text>
            <Text style={styles.featuredItemSubtitle}>Tap for help</Text>
          </TouchableOpacity>
          
          {/* Local Services */}
          <TouchableOpacity 
            style={styles.featuredItem}
            onPress={() => navigateToServiceScreen('local')}
          >
            <View style={[styles.featuredIconContainer, { backgroundColor: '#9370db20' }]}>
              <Ionicons name="location" size={40} color="#9370db" />
            </View>
            <Text style={styles.featuredItemTitle}>Local Services</Text>
            <Text style={styles.featuredItemSubtitle}>Tap to explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

return (
  <SafeAreaView style={styles.safeArea}>
    {/* Gradient overlay for depth */}
   {/* Animated Background */}
         <LinearGradient
           colors={['#083028','#0a0a0a',  '#0a0a0a']}
           style={styles.background}
         />

    {/* Futuristic SVG background */}
    <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}>
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <Path
          d="
            M12 18 C15 12, 25 12, 28 18
            M62 14 C65 10, 75 10, 78 14
            M20 80 C22 85, 28 85, 30 80
            M70 82 C72 87, 78 87, 80 82
            M34 34 Q40 28, 46 34
            M60 60 Q66 66, 72 60
            M25 65 C30 58, 40 58, 45 65
            M10 45 C15 52, 25 52, 30 45
            M58 26 Q64 20, 70 26
            M42 78 Q48 72, 54 78
            M5 5 C8 3, 12 3, 15 5
            M85 95 C88 93, 92 93, 95 95
          "
          stroke="green"
          strokeWidth="0.25"
          fill="none"
        />
      </Svg>
    </View>

    {/* Main Scrollable Content */}
    <ScrollView showsVerticalScrollIndicator={false} style={{ zIndex: 1 }}>
      
     
      <FeaturedServices />

      {/* Separator */}
      <View style={styles.separator} />

      <View style={styles.servicesContainer}>
        <Text style={styles.sectionTitle}>All Services</Text>

        <View style={styles.servicesGrid}>
          {services.map((service, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.serviceItem}
              onPress={() => handleServicePress(service)}
            >
              <View style={[styles.iconContainer, { backgroundColor: service.color + '20' }]}>
                <Ionicons name={service.icon} size={28} color={service.color} />
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'ivory',
    padding: 16,
    paddingTop: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  safeArea: {
  flex: 1,
  backgroundColor: '#FFFFFF',
},

sectionTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1C1C1E',
  marginTop: 16,
  marginBottom: 10,
  marginHorizontal: 16,
},

separator: {
  height: 1,
  backgroundColor: '#EAEAEA',
  marginVertical: 16,
  marginHorizontal: 20,
},

  featuredContainer: {
    margin: 10,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  featuredGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',margin: 10,
  },
  featuredItem: {
    width: '48%',
    height: 180,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,margin: 10,
  },
  featuredItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    textAlign: 'center',
  },
  featuredItemSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  servicesContainer: {
    marginBottom: 20,margin: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    flexWrap: 'wrap',
  },
});

export default ServicesScreen;