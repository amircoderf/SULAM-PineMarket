import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FFB300', // Pineapple yellow
    accent: '#FF6F00', // Orange accent
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    error: '#D32F2F',
    success: '#388E3C',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
  },
  roundness: 8,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 12,
    color: '#757575',
  },
};
