// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// App Colors
export const COLORS = {
  primary: '#2196F3',
  secondary: '#FF9800',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Status colors
  available: '#4CAF50',
  occupied: '#F44336',
  unknown: '#FF9800',
  
  // Text colors
  textPrimary: '#333',
  textSecondary: '#666',
  textLight: '#999',
  
  // Background colors
  background: '#f5f5f5',
  surface: '#fff',
  border: '#e0e0e0',
  
  // Social colors
  whatsapp: '#25D366',
  call: '#4CAF50',
};

// Rental Types
export const RENTAL_TYPES = {
  BEDSITTER: 'bedsitter',
  ONE_BEDROOM: '1bedroom',
  TWO_BEDROOM: '2bedroom',
  THREE_BEDROOM: '3bedroom',
  SINGLE_ROOM: 'single',
  STUDIO: 'studio',
  HOSTEL: 'hostel',
};

// Vacancy Status
export const VACANCY_STATUS = {
  VERIFIED_VACANT: 'verified_vacant',
  VERIFIED_OCCUPIED: 'verified_occupied',
  PENDING_VERIFICATION: 'pending_verification',
  UNKNOWN: 'unknown',
};

// Vacancy Status Display
export const VACANCY_STATUS_DISPLAY = {
  [VACANCY_STATUS.VERIFIED_VACANT]: {
    text: 'Available',
    color: COLORS.available,
  },
  [VACANCY_STATUS.VERIFIED_OCCUPIED]: {
    text: 'Occupied',
    color: COLORS.occupied,
  },
  [VACANCY_STATUS.PENDING_VERIFICATION]: {
    text: 'Pending',
    color: COLORS.warning,
  },
  [VACANCY_STATUS.UNKNOWN]: {
    text: 'Unknown',
    color: COLORS.unknown,
  },
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};

// Search
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 500,
};

// Phone number validation regex
export const PHONE_REGEX = /^\+254[0-9]{9}$/;

// Default messages
export const DEFAULT_MESSAGES = {
  INQUIRY: "I'm interested in this rental. Please provide more details.",
  WHATSAPP_INQUIRY: (rentalName, location) => 
    `Hi, I'm interested in the ${rentalName} rental in ${location}. Is it still available?`,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  VOTE_SUBMITTED: 'Thank you for your vote!',
  INQUIRY_SENT: 'Your inquiry has been sent successfully.',
  DATA_UPDATED: 'Data updated successfully.',
};

// Screen names
export const SCREENS = {
  RENTAL_HOME: 'RentalHome',
  RENTAL_DETAIL: 'RentalDetail',
  LOGIN: 'Login',
  REGISTER: 'Register',
  PROFILE: 'Profile',
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'user',
  FAVORITES: 'favorites',
  SEARCH_HISTORY: 'searchHistory',
};

// Animation durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Component sizes
export const SIZES = {
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  CARD_RADIUS: 12,
  BUTTON_RADIUS: 8,
  ICON_SIZE: 24,
  AVATAR_SIZE: 40,
};

// Fonts
export const FONTS = {
  REGULAR: 'System',
  MEDIUM: 'System',
  BOLD: 'System',
  
  SIZES: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
  },
};

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

export default {
  API_CONFIG,
  COLORS,
  RENTAL_TYPES,
  VACANCY_STATUS,
  VACANCY_STATUS_DISPLAY,
  PAGINATION,
  SEARCH,
  PHONE_REGEX,
  DEFAULT_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SCREENS,
  STORAGE_KEYS,
  ANIMATIONS,
  SIZES,
  FONTS,
  SPACING,
};