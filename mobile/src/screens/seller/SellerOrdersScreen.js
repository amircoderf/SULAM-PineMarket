import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Chip,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { sellerAPI } from '../../services/api';
import { theme } from '../../theme';

const SellerOrdersScreen = ({ navigation, route }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);

      const params = {
        page: pageNum,
        limit: 20,
      };

      // If a productId was provided via navigation, pass it as a filter
      if (route?.params?.productId) {
        params.productId = route.params.productId;
      }

      const data = await sellerAPI.getOrders(params);

      if (append) {
        setOrders(prev => [...prev, ...(data?.orders || [])]);
      } else {
        setOrders(data?.orders || []);
      }

      setHasMore(data?.pagination?.pages > pageNum);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      setSnackbarMessage('Failed to load orders');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchOrders(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchOrders(page + 1, true);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'confirmed': return '#42A5F5';
      case 'shipped': return '#66BB6A';
      case 'delivered': return '#26A69A';
      case 'cancelled': return '#EF5350';
      case 'refunded': return '#AB47BC';
      default: return '#757575';
    }
  };

  const renderOrderItem = ({ item }) => (
    <Card style={styles.orderCard}>
      <TouchableOpacity onPress={() => toggleOrderExpansion(item.order_id)}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{item.order_id.slice(-8)}</Text>
            <Text style={styles.buyerName}>{item.buyer_name}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.orderSummary}>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.order_status) }]}
              textStyle={styles.chipText}
            >
              {item.order_status}
            </Chip>
            <Text style={styles.totalAmount}>RM{parseFloat(item.total_amount).toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {expandedOrders[item.order_id] && (
        <View style={styles.orderDetails}>
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Order Items:</Text>
          {item.order_items?.map((orderItem, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {orderItem.product_name}
                </Text>
                <Text style={styles.itemDetails}>
                  {orderItem.quantity} × RM{parseFloat(orderItem.price).toFixed(2)}
                </Text>
                <Text style={styles.itemTotal}>
                  RM{parseFloat(orderItem.total_price).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Delivery Address:</Text>
          <Text style={styles.address}>{item.delivery_address}</Text>

          <Text style={styles.sectionTitle}>Buyer Contact:</Text>
          <Text style={styles.contact}>{item.buyer_email}</Text>
        </View>
      )}
    </Card>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {route?.params?.productId && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterText}>Showing orders for product #{route.params.productId}</Text>
        </View>
      )}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.order_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Orders for your products will appear here
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore && orders.length > 0 ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading more orders...</Text>
            </View>
          ) : null
        }
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
  },
  orderCard: {
    margin: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  buyerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderSummary: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 8,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  orderDetails: {
    padding: 16,
    paddingTop: 0,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 2,
  },
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contact: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  filterBanner: {
    padding: 10,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
  },
  filterText: {
    color: '#333',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default SellerOrdersScreen;
