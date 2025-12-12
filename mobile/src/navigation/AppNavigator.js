import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MyReviewsScreen from '../screens/MyReviewsScreen';
import AddReviewScreen from '../screens/AddReviewScreen';
import ProductReviewsScreen from '../screens/ProductReviewsScreen';

// Seller Screens
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import AddProductScreen from '../screens/seller/AddProductScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ title: '🍍 PineMarket' }}
    />
    <Stack.Screen 
      name="ProductList" 
      component={ProductListScreen} 
      options={{ title: 'Products' }}
    />
    <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen} 
      options={{ title: 'Product Details' }}
    />
    
    <Stack.Screen 
      name="AddReview" 
      component={AddReviewScreen} 
      options={{ title: 'Write a Review' }}
    />
    <Stack.Screen
      name="ProductReviews"
      component={ProductReviewsScreen}
      options={{ title: 'Product Reviews' }}
    />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CartMain" 
      component={CartScreen} 
      options={{ title: 'Shopping Cart' }}
    />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="OrdersMain" 
      component={OrdersScreen} 
      options={{ title: 'My Orders' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="Favorites" 
      component={FavoritesScreen} 
      options={{ title: 'My Favorites' }}
    />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="MyReviews" 
        component={MyReviewsScreen} 
        options={{ title: 'My Reviews' }}
      />
    <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen} 
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen
      name="ProductReviews"
      component={ProductReviewsScreen}
      options={{ title: 'Product Reviews' }}
    />
  </Stack.Navigator>
);

const SellerStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="SellerDashboardMain" 
      component={SellerDashboardScreen} 
      options={{ title: 'Seller Dashboard' }}
    />
    <Stack.Screen 
      name="AddProduct" 
      component={AddProductScreen} 
      options={{ title: 'Add Product' }}
    />
    <Stack.Screen 
      name="SellerOrders" 
      component={SellerOrdersScreen} 
      options={{ title: 'Customer Orders' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { isSeller } = useAuth();
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else if (route.name === 'Seller') {
            iconName = focused ? 'store' : 'store-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFB300',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen 
        name="Cart" 
        component={CartStack}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : null,
        }}
      />
      <Tab.Screen name="Orders" component={OrdersStack} />
      {isSeller && (
        <Tab.Screen name="Seller" component={SellerStack} />
      )}
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or loading screen
  }

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
};

export default AppNavigator;
