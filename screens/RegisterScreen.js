import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';

import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Linking
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loading, error } = useAuth();

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  // Google Sign-in coming soon flag
  const GOOGLE_SIGNIN_ENABLED = false;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '#666' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, text: 'Weak', color: '#FF6B6B' };
    if (strength <= 3) return { strength, text: 'Fair', color: '#FFB74D' };
    if (strength <= 4) return { strength, text: 'Good', color: '#81C784' };
    return { strength, text: 'Strong', color: '#00C896' };
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    
    if (formData.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }
    
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      setIsRedirecting(true);
      setFeedback('Creating your account...');
      
      await register(formData);
      
      setFeedback('Registration successful! Redirecting...');
      // Navigation is handled by the AppNavigator based on auth state
    } catch (err) {
      console.error('Registration error:', err);
      setIsRedirecting(false);
      setFeedback('');
      Alert.alert('Registration Failed', error || 'Please try again with different credentials');
    }
  };

  const handleComingSoonPress = () => {
    Alert.alert(
      'Coming Soon!', 
      'Google Sign-in will be available in a future update. For now, please use traditional registration.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const openTerms = (e) => {
    if (e) e.stopPropagation();
    Linking.openURL('https://moihub-silk.vercel.app/learnmore');
  };

  const openPrivacy = (e) => {
    if (e) e.stopPropagation();
    Linking.openURL('https://moihub-silk.vercel.app/learnmore');
  };

  return (
    <View style={styles.container}>
      <View style={styles.glowCircle} />
      <View style={styles.glowCircle2} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <Image 
            source={require('../assets/moihublogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        
          <Text style={styles.title}>CREATE ACCOUNT</Text>
          <Text style={styles.subtitle}>Join our ecosystem</Text>

          {/* Social Sign-Up Section - Coming Soon */}
          {GOOGLE_SIGNIN_ENABLED ? (
            <>
              <View style={styles.socialSection}>
                <TouchableOpacity 
                  style={styles.googleButton}
                  onPress={() => {/* Google sign-in logic when enabled */}}
                >
                  <Icon name="google" size={24} color="#DB4437" style={styles.icon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.socialSection}>
                <TouchableOpacity 
                  style={[styles.googleButton, styles.comingSoonButton]}
                  onPress={handleComingSoonPress}
                >
                  <Icon name="google" size={24} color="#DB4437" style={styles.icon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR REGISTER WITH EMAIL</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          {/* Traditional Registration Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#88A99B"
                value={formData.username}
                onChangeText={(value) => handleChange('username', value)}
                autoCapitalize="none"
              />
              {formData.username && formData.username.length < 3 ? (
                <Text style={styles.errorText}>Username must be at least 3 characters</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#88A99B"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Create a password"
                  placeholderTextColor="#88A99B"
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? "eye" : "eye-slash"} size={20} color="#88A99B" />
                </TouchableOpacity>
              </View>
              {formData.password ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <View
                        key={bar}
                        style={[
                          styles.strengthBar,
                          bar <= getPasswordStrength(formData.password).strength && {
                            backgroundColor: getPasswordStrength(formData.password).color
                          }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: getPasswordStrength(formData.password).color }]}>
                    {getPasswordStrength(formData.password).text}
                  </Text>
                </View>
              ) : null}
              {formData.password && formData.password.length < 8 ? (
                <Text style={styles.errorText}>Password must be at least 8 characters</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#88A99B"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon name={showConfirmPassword ? "eye" : "eye-slash"} size={20} color="#88A99B" />
                </TouchableOpacity>
              </View>
              {formData.confirmPassword && formData.password !== formData.confirmPassword ? (
                <Text style={styles.errorText}>Passwords do not match</Text>
              ) : null}
            </View>

            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Icon name="check" size={14} color="#093028" />}
              </View>
              <Text style={styles.termsText}>
                By agreeing, you have accepted our{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={openTerms}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={openPrivacy}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, (loading || isRedirecting) && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading || isRedirecting}
            >
              {loading || isRedirecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>REGISTER</Text>
              )}
            </TouchableOpacity>

            {feedback ? (
              <Text style={styles.feedbackText}>{feedback}</Text>
            ) : null}

            <View style={styles.loginContainer}>
              <Text style={styles.loginPrompt}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}> Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#093028',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  glowCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(0, 255, 179, 0.08)',
    top: -width * 0.75,
    left: -width * 0.25,
  },
  glowCircle2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: 'rgba(0, 255, 179, 0.05)',
    bottom: -width * 0.3,
    right: -width * 0.2,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 60,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E0FFF5',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#88A99B',
    marginBottom: 30,
    textAlign: 'center',
  },
  socialSection: {
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  comingSoonButton: {
    opacity: 0.7,
    backgroundColor: '#f5f5f5',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#0F5443',
  },
  dividerText: {
    color: '#88A99B',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: '#E0FFF5',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#0F5443',
    backgroundColor: 'rgba(15, 84, 67, 0.3)',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#E0FFF5',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#0F5443',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0F5443',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 84, 67, 0.3)',
  },
  checkboxChecked: {
    backgroundColor: '#00C896',
    borderColor: '#00C896',
  },
  termsText: {
    flex: 1,
    color: '#88A99B',
    fontSize: 13,
    lineHeight: 18,
  },
  termsLink: {
    color: '#2DFFC3',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#00C896',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00FFC3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#00805F',
    opacity: 0.6,
  },
  buttonText: {
    color: '#093028',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  feedbackText: {
    color: '#2DFFC3',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  loginPrompt: {
    color: '#88A99B',
  },
  loginText: {
    color: '#2DFFC3',
    fontWeight: '600',
  },
});

export default RegisterScreen;