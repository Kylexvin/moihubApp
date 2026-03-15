// theme/Theme.js
import { StyleSheet } from 'react-native';

export const Colors = {
  primary: '#50c878',       // Main green
  primaryDark: '#083028',   // Dark green
  primaryLight: '#50c87820', // Light green with opacity
  secondary: '#ff7f50',     // Coral orange
  accent: '#9370db',        // Purple
  background: '#0a0a0a',    // Dark background
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.1)',
  text: '#ffffff',
  textSecondary: '#888888',
  textTertiary: '#777777',
  success: '#50c878',
  warning: '#ffb347',
  danger: '#e74c3c',
  info: '#3498db',
  white: '#ffffff',
  black: '#000000',
  
  // Service category colors
  uni: '#50c878',
  accom: '#50c878',
  pharma: '#8e44ad',
  food: '#ff7f50',
  shop: '#ffb347',
  local: '#3498db'
};

export const Gradients = {
  primary: ['#083028', '#0a0a0a', '#0a0a0a'],
  dark: ['#0a0a0a', '#0a0a0a'],
  green: ['#083028', '#50c87820'],
  purple: ['#2c003e', '#9370db20']
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    color: Colors.text,
  },
  bodySmall: {
    fontSize: 14,
    color: Colors.text,
  },
  caption: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  }
};

export const Components = StyleSheet.create({
  // Card Styles
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
  },
  cardHighlighted: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.md,
  },
  
  // Button Styles
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  buttonTextPrimary: {
    ...Typography.button,
    color: Colors.black,
  },
  buttonTextSecondary: {
    ...Typography.button,
    color: Colors.text,
  },
  
  // Input Styles
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  // Chip/Tag Styles
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.black,
  },
  
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  
  // Grid Styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },
});

// Theme export
export default {
  Colors,
  Gradients,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Components,
};
