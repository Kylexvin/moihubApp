import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ServicesScreen = () => {
  const navigation = useNavigation();
  
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
      color: "#ff7f50" ,
      onPress: () => navigation.navigate('FoodStack', { screen: 'FoodHome' })
    },
    { 
      title: "Cafeteria Menu", 
      icon: "restaurant", 
      category: "food",
      color: "#ff7f50" 
    },
    { 
      title: "Groceries", 
      icon: "cart", 
      category: "food",
      color: "#ff7f50" 
    },



   
    { 
      title: "LinkMe", 
      icon: "heart", 
      category: "local",
      color: "red" 
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

  // Handle service item press
const handleServicePress = (service) => {
  switch (service.title) {
    case 'LinkMe':
      navigation.navigate('LinkMeStack');
      break;

    case 'Food Delivery':
      navigation.navigate('FoodStack', { screen: 'FoodHome' });
      break;

    case 'Cafeteria Menu':
      navigation.navigate('CafeteriaStack', { screen: 'CafeteriaHome' });
      break;

    case 'Groceries':
      navigation.navigate('GroceryStack', { screen: 'GroceryHome' });
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
      navigation.navigate('UniStack', { screen: 'UniHome' });
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
        <Text style={styles.featuredTitle}>Featured Services</Text>
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
    <View style={styles.screenContainer}>
      {/* Header (simplified without search) */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>MoiHub Services</Text>
      </View>

      {/* Main Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <FeaturedServices />

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
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  featuredContainer: {
    marginBottom: 20,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  featuredGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 12,
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
    marginBottom: 20,
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