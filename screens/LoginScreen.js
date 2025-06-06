import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  const { login, loading, error } = useAuth();
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
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

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      setIsRedirecting(true);
      setFeedback('Logging in...');
      
      await login(emailOrUsername, password);
      
      setFeedback('Login successful! Redirecting...');
      // Navigation is handled by the AppNavigator based on auth state
    } catch (err) {
      console.error('Login error:', err);
      setIsRedirecting(false);
      setFeedback('');
      Alert.alert('Login Failed', error || 'Please check your credentials and try again');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.glowCircle} />
      <View style={styles.glowCircle2} />
      
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
        
        <Text style={styles.title}>MoiHub</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email or username"
              placeholderTextColor="#88A99B"
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#88A99B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (loading || isRedirecting) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading || isRedirecting}
          >
            {loading || isRedirecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </TouchableOpacity>
          
          {feedback ? (
            <Text style={styles.feedbackText}>{feedback}</Text>
          ) : null}

          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}> Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#093028',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#2DFFC3',
    fontSize: 14,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerPrompt: {
    color: '#88A99B',
  },
  registerText: {
    color: '#2DFFC3',
    fontWeight: '600',
  },
});

export default LoginScreen;