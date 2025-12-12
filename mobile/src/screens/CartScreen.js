import React, { useContext, useState, useEffect } from 'react';
import AddressSummaryCard from '../components/AddressSummaryCard';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Button,
  Divider,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { theme } from '../theme';

const CartScreen = ({ navigation }) => {
  const { cartItems, cartTotal, cartCount, updateCartItem, removeFromCart, clearCart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

    const [selectedAddressId, setSelectedAddressId] = useState(null);
  const loadCart = async () => {
    setLoading(true);
    await fetchCart();
    setLoading(false);
  };

  const handleUpdateQuantity = async (cartId, newQuantity, maxStock) => {
    if (newQuantity < 1) {
      Alert.alert(
        'Remove Item',
        'Do you want to remove this item from cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', onPress: () => handleRemoveItem(cartId) },
        ]
      );
      return;
    }

    if (newQuantity > maxStock) {
      showSnackbar(`Only ${maxStock} items available in stock`);
      return;
    }

    try {
      const result = await updateCartItem(cartId, newQuantity);
      if (result.success) {
        showSnackbar('Cart updated');
      } else {
        showSnackbar(result.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Update cart error:', error);
      showSnackbar(error.message || 'Failed to update cart');
    }
  };

  const handleRemoveItem = async (cartId) => {
    try {
      const result = await removeFromCart(cartId);
      if (result.success) {
        showSnackbar('Item removed from cart');
      } else {
        showSnackbar(result.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Remove item error:', error);
      showSnackbar(error.message || 'Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showSnackbar('Your cart is empty');
      return;
    }

    // Check if any items are out of stock
    const outOfStock = cartItems.find(item => item.stock_quantity < item.quantity);
    if (outOfStock) {
      showSnackbar(`${outOfStock.product_name} is out of stock`);
      return;
    }

    setCheckoutLoading(true);
    try {
      if (!selectedAddressId) {
        showSnackbar('Please select or add a shipping address');
        setCheckoutLoading(false);
        return;
      }
      const orderData = {
        paymentMethod: 'cash_on_delivery',
        notes: 'Order from mobile app',
        shippingAddressId: selectedAddressId,
      };
      const order = await ordersAPI.create(orderData);
      // Clear cart after successful order
      await clearCart();
      const orderNumber = order.order_number || (order.order && order.order.order_number) || 'N/A';
      Alert.alert(
        'Order Placed!',
        `Your order #${orderNumber} has been placed successfully.`,
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Orders'),
          },
          {
            text: 'Continue Shopping',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      console.error('Checkout error:', error);
      showSnackbar(error.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
              showSnackbar('Cart cleared');
            } catch (error) {
              showSnackbar('Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const renderCartItem = ({ item }) => (
    <Card style={styles.cartItem}>
      <View style={styles.itemContent}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>🍍</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.itemDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          
          <Text style={styles.price}>RM{parseFloat(item.price).toFixed(2)}</Text>
          
          <View style={styles.quantityContainer}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => handleUpdateQuantity(item.cart_id, item.quantity - 1, item.stock_quantity)}
            />
            <Text style={styles.quantity}>{item.quantity}</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => handleUpdateQuantity(item.cart_id, item.quantity + 1, item.stock_quantity)}
            />
          </View>

          {item.stock_quantity < item.quantity && (
            <Text style={styles.outOfStock}>
              Only {item.stock_quantity} available
            </Text>
          )}
        </View>

        <View style={styles.itemRight}>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleRemoveItem(item.cart_id)}
          />
          <Text style={styles.subtotal}>
            RM{(parseFloat(item.price) * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderSummary = () => {
    const shipping = 50;
    const taxRate = 0.03;
    const subtotal = cartTotal;
    const tax = subtotal * taxRate;
    const total = subtotal + shipping + tax;

    return (
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({cartCount} items)</Text>
          <Text style={styles.summaryValue}>RM{subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping Fee</Text>
          <Text style={styles.summaryValue}>RM{shipping.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (3%)</Text>
          <Text style={styles.summaryValue}>RM{tax.toFixed(2)}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>RM{total.toFixed(2)}</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          loading={checkoutLoading}
          disabled={checkoutLoading || cartItems.length === 0}
        >
          Proceed to Checkout
        </Button>

        {cartItems.length > 0 && (
          <Button
            mode="text"
            onPress={handleClearCart}
            style={styles.clearButton}
          >
            Clear Cart
          </Button>
        )}
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Please log in to view your cart</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
          style={styles.loginButton}
        >
          Login
        </Button>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.shopButton}
        >
          Start Shopping
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.cart_id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <AddressSummaryCard
            selectedAddressId={selectedAddressId}
            onSelect={setSelectedAddressId}
            onAddNew={() => {}}
          />
        }
        ListFooterComponent={renderSummary}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    padding: 10,
  },
  cartItem: {
    marginBottom: 10,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 35,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  outOfStock: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  subtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summary: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 10,
    borderRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  checkoutButton: {
    marginTop: 16,
    paddingVertical: 6,
  },
  clearButton: {
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loginButton: {
    paddingHorizontal: 40,
  },
  shopButton: {
    paddingHorizontal: 40,
  },
});

export default CartScreen;
