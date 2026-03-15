import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Midnight Bloom Theme (matching your other screens)
const theme = {
  primary: '#4A2C3D',     // Deep mauve
  secondary: '#6B4E5E',   // Dusty rose
  accent: '#C45A8A',      // Bright rose
  background: '#241A20',  // Dark purple-gray
  card: '#3A2A32',        // Dark mauve
  text: '#F7E6F0',        // Soft pink-white
  textSecondary: '#B39AA5', // Muted pink
  border: '#5A3E4E',      // Medium mauve
  error: '#D45D5D',       // Rose red
  success: '#7A9E7A',     // Sage green
  warning: '#E6B89C',     // Peach
  gradient: ['#4A2C3D', '#6B4E5E', '#C45A8A'],
};

const Checkout = ({ route }) => {
  const navigation = useNavigation();
  const { cart, user, totalAmount, shopInfo } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [activeStep, setActiveStep] = useState(1); // 1: summary, 2: payment, 3: confirm

  // Calculate totals
  const subtotal = totalAmount || cart?.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) || 0;
  const deliveryFee = subtotal > 2000 ? 0 : 150;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress && paymentMethod !== 'pickup') {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.productId || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          shopId: item.shopId || item.shop,
        })),
        userId: user?._id || user?.id,
        shopId: shopInfo?._id,
        totalAmount: total,
        paymentMethod,
        deliveryAddress: paymentMethod === 'pickup' ? 'Store Pickup' : deliveryAddress,
        deliveryNotes,
        status: 'pending',
      };

      const res = await axios.post('/api/echem/orders', orderData);
      
      if (res.data.success) {
        Alert.alert(
          '✅ Order Placed!',
          'Your order has been placed successfully.',
          [
            {
              text: 'View Orders',
              onPress: () => navigation.navigate('Orders'),
            },
            {
              text: 'Continue Shopping',
              onPress: () => navigation.navigate('PharmacyBrowse'),
            },
          ]
        );
      }
    } catch (err) {
      console.error('Checkout failed', err);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = (step, title) => {
    const isActive = activeStep === step;
    const isCompleted = activeStep > step;

    return (
      <View style={styles.stepContainer}>
        <View style={[
          styles.stepCircle,
          isActive && styles.activeStepCircle,
          isCompleted && styles.completedStepCircle
        ]}>
          {isCompleted ? (
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.stepNumber,
              isActive && styles.activeStepNumber
            ]}>{step}</Text>
          )}
        </View>
        <Text style={[
          styles.stepTitle,
          isActive && styles.activeStepTitle
        ]}>{title}</Text>
        {step < 3 && (
          <View style={[
            styles.stepLine,
            isCompleted && styles.completedStepLine
          ]} />
        )}
      </View>
    );
  };

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="shopping-bag" size={20} color={theme.accent} />
        <Text style={styles.sectionTitle}>Order Summary</Text>
      </View>

      {cart?.map((item, index) => (
        <View key={index} style={styles.orderItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemQuantity}>x{item.quantity || 1}</Text>
          </View>
          <Text style={styles.itemPrice}>
            KSh {(item.price * (item.quantity || 1)).toLocaleString()}
          </Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Subtotal</Text>
        <Text style={styles.priceValue}>KSh {subtotal.toLocaleString()}</Text>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Delivery Fee</Text>
        <Text style={styles.priceValue}>
          {deliveryFee === 0 ? 'Free' : `KSh ${deliveryFee.toLocaleString()}`}
        </Text>
      </View>

      {deliveryFee > 0 && (
        <Text style={styles.freeDeliveryNote}>
          ✨ Free delivery on orders over KSh 2,000
        </Text>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>KSh {total.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderDeliveryInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={20} color={theme.accent} />
        <Text style={styles.sectionTitle}>Delivery Information</Text>
      </View>

      <View style={styles.paymentMethods}>
        <TouchableOpacity
          style={[
            styles.paymentMethodCard,
            paymentMethod === 'delivery' && styles.selectedPaymentMethod
          ]}
          onPress={() => setPaymentMethod('delivery')}
        >
          <LinearGradient
            colors={paymentMethod === 'delivery' 
              ? [theme.accent, theme.secondary]
              : ['transparent', 'transparent']}
            style={styles.paymentMethodGradient}
          >
            <Ionicons 
              name="bicycle-outline" 
              size={24} 
              color={paymentMethod === 'delivery' ? '#FFFFFF' : theme.textSecondary} 
            />
            <Text style={[
              styles.paymentMethodText,
              paymentMethod === 'delivery' && styles.selectedPaymentMethodText
            ]}>Delivery</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentMethodCard,
            paymentMethod === 'pickup' && styles.selectedPaymentMethod
          ]}
          onPress={() => setPaymentMethod('pickup')}
        >
          <LinearGradient
            colors={paymentMethod === 'pickup' 
              ? [theme.accent, theme.secondary]
              : ['transparent', 'transparent']}
            style={styles.paymentMethodGradient}
          >
            <Ionicons 
              name="storefront-outline" 
              size={24} 
              color={paymentMethod === 'pickup' ? '#FFFFFF' : theme.textSecondary} 
            />
            <Text style={[
              styles.paymentMethodText,
              paymentMethod === 'pickup' && styles.selectedPaymentMethodText
            ]}>Store Pickup</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {paymentMethod === 'delivery' && (
        <>
          <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter delivery address"
                placeholderTextColor={theme.textSecondary}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>
          </BlurView>

          <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Additional notes (optional)"
                placeholderTextColor={theme.textSecondary}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
              />
            </View>
          </BlurView>

          <Text style={styles.helperText}>
            ⏱️ Estimated delivery: 30-45 minutes
          </Text>
        </>
      )}

      {paymentMethod === 'pickup' && (
        <View style={styles.pickupInfo}>
          <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
          <Text style={styles.pickupText}>
            You'll be notified when your order is ready for pickup at the store.
          </Text>
        </View>
      )}
    </View>
  );

  const renderPaymentInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name="money-bill-wave" size={18} color={theme.accent} />
        <Text style={styles.sectionTitle}>Payment Method</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'mpesa' && styles.selectedPaymentOption
        ]}
        onPress={() => setPaymentMethod('mpesa')}
      >
        <View style={styles.paymentOptionLeft}>
          <FontAwesome5 name="mobile-alt" size={20} color={paymentMethod === 'mpesa' ? theme.accent : theme.textSecondary} />
          <View>
            <Text style={styles.paymentOptionTitle}>M-Pesa</Text>
            <Text style={styles.paymentOptionDesc}>Pay via mobile money</Text>
          </View>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'mpesa' && styles.radioButtonSelected
        ]}>
          {paymentMethod === 'mpesa' && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'card' && styles.selectedPaymentOption
        ]}
        onPress={() => setPaymentMethod('card')}
      >
        <View style={styles.paymentOptionLeft}>
          <FontAwesome5 name="credit-card" size={18} color={paymentMethod === 'card' ? theme.accent : theme.textSecondary} />
          <View>
            <Text style={styles.paymentOptionTitle}>Card Payment</Text>
            <Text style={styles.paymentOptionDesc}>Visa, Mastercard, etc.</Text>
          </View>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'card' && styles.radioButtonSelected
        ]}>
          {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'cash' && styles.selectedPaymentOption
        ]}
        onPress={() => setPaymentMethod('cash')}
      >
        <View style={styles.paymentOptionLeft}>
          <FontAwesome5 name="money-bill" size={18} color={paymentMethod === 'cash' ? theme.accent : theme.textSecondary} />
          <View>
            <Text style={styles.paymentOptionTitle}>Cash on Delivery</Text>
            <Text style={styles.paymentOptionDesc}>Pay when you receive</Text>
          </View>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'cash' && styles.radioButtonSelected
        ]}>
          {paymentMethod === 'cash' && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      
      <LinearGradient
        colors={[theme.background, '#1A1218']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {renderStepIndicator(1, 'Summary')}
          {renderStepIndicator(2, 'Delivery')}
          {renderStepIndicator(3, 'Payment')}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeStep === 1 && renderOrderSummary()}
        {activeStep === 2 && renderDeliveryInfo()}
        {activeStep === 3 && renderPaymentInfo()}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {activeStep > 1 && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={() => setActiveStep(activeStep - 1)}
            >
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}

          {activeStep < 3 ? (
            <TouchableOpacity
              style={styles.nextStepButton}
              onPress={() => setActiveStep(activeStep + 1)}
            >
              <LinearGradient
                colors={[theme.accent, theme.secondary]}
                style={styles.nextStepGradient}
              >
                <Text style={styles.nextStepText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [theme.border, theme.border] : theme.gradient}
                style={styles.placeOrderGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.placeOrderText}>Place Order</Text>
                    <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary at bottom */}
        {activeStep > 1 && (
          <BlurView intensity={40} tint="dark" style={styles.stickySummary}>
            <View style={styles.stickyRow}>
              <Text style={styles.stickyLabel}>Total:</Text>
              <Text style={styles.stickyTotal}>KSh {total.toLocaleString()}</Text>
            </View>
          </BlurView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeStepCircle: {
    backgroundColor: theme.accent,
  },
  completedStepCircle: {
    backgroundColor: theme.success,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeStepNumber: {
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  activeStepTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    right: -50,
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  completedStepLine: {
    backgroundColor: theme.success,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    color: theme.text,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 13,
    color: theme.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    color: theme.text,
  },
  freeDeliveryNote: {
    fontSize: 12,
    color: theme.success,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.accent,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentMethodCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  paymentMethodGradient: {
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  selectedPaymentMethod: {
    borderColor: theme.accent,
  },
  selectedPaymentMethodText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputBlur: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(58, 42, 50, 0.3)',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.text,
  },
  helperText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(196, 90, 138, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  pickupText: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedPaymentOption: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(196, 90, 138, 0.1)',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.accent,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.accent,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  backStepButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  backStepText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  nextStepButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextStepGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextStepText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeOrderButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeOrderGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stickySummary: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stickyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stickyLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  stickyTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.accent,
  },
});

export default Checkout;