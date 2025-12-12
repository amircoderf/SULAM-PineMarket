import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Divider,
  ActivityIndicator,
  Button,
  Searchbar,
  Menu,
} from 'react-native-paper';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orderDetails, setOrderDetails] = useState({});

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchOrders = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 10,
        status: statusFilter,
      };

      const data = await ordersAPI.getAll(params);
      
      if (append) {
        setOrders([...orders, ...(data?.orders || [])]);
      } else {
        setOrders(data?.orders || []);
      }
      
      setHasMore(data?.pagination?.page < data?.pagination?.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchOrders(page + 1, true);
    }
  };

  const handleOrderPress = async (orderId) => {
    // Toggle expanded state
    const isExpanded = expandedOrders[orderId];
    
    if (isExpanded) {
      // Collapse
      setExpandedOrders(prev => ({ ...prev, [orderId]: false }));
    } else {
      // Expand and fetch details if not already loaded
      setExpandedOrders(prev => ({ ...prev, [orderId]: true }));
      
      if (!orderDetails[orderId]) {
        try {
          const data = await ordersAPI.getById(orderId);
          // Backend returns {success, data: {order: {...}}}
          // After API method, we get {success, data}
          const orderData = data?.order || data;
          setOrderDetails(prev => ({ ...prev, [orderId]: orderData }));
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      processing: '#9b59b6',
      shipped: '#1abc9c',
      delivered: '#27ae60',
      cancelled: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderOrder = ({ item }) => {
    const orderId = item.order_id || item.id;
    const isExpanded = expandedOrders[orderId];
    const details = orderDetails[orderId];
    
    return (
      <Card style={styles.orderCard}>
        <TouchableOpacity onPress={() => handleOrderPress(orderId)}>
          <View style={styles.cardContent}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
                <Text style={styles.orderDate}>
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.order_status) + '20' }]}
                textStyle={{ color: getStatusColor(item.order_status) }}
              >
                {getStatusLabel(item.order_status)}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Items:</Text>
                <Text style={styles.detailValue}>{item.item_count}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtotal:</Text>
                <Text style={styles.detailValue}>RM{parseFloat(item.total_amount || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shipping:</Text>
                <Text style={styles.detailValue}>RM{parseFloat(item.shipping_fee || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tax:</Text>
                <Text style={styles.detailValue}>RM{parseFloat(item.tax_amount || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total:</Text>
                <Text style={styles.totalAmount}>RM{parseFloat(item.final_amount || item.total_amount).toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment:</Text>
                <Text style={styles.detailValue}>
                  {item.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : item.payment_method}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && details && (
          <View style={styles.itemsSection}>
            <Divider />
            <Text style={styles.itemsTitle}>Order Items</Text>
            {details.items?.map((orderItem, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemLeft}>
                  {orderItem.image_url ? (
                    <Image source={{ uri: orderItem.image_url }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, styles.placeholderImage]}>
                      <Text style={styles.placeholderText}>🍍</Text>
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {orderItem.product_name}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      Qty: {orderItem.quantity} × RM{parseFloat(orderItem.unit_price).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemTotal}>
                  RM{parseFloat(orderItem.total_price).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>My Orders</Text>
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setMenuVisible(true)}
            style={styles.filterButton}
          >
            Filter: {statusFilter ? getStatusLabel(statusFilter) : 'All'}
          </Button>
        }
      >
        <Menu.Item
          onPress={() => {
            setStatusFilter(null);
            setMenuVisible(false);
          }}
          title="All Orders"
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter('pending');
            setMenuVisible(false);
          }}
          title="Pending"
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter('confirmed');
            setMenuVisible(false);
          }}
          title="Confirmed"
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter('processing');
            setMenuVisible(false);
          }}
          title="Processing"
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter('shipped');
            setMenuVisible(false);
          }}
          title="Shipped"
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter('delivered');
            setMenuVisible(false);
          }}
          title="Delivered"
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter('cancelled');
            setMenuVisible(false);
          }}
          title="Cancelled"
        />
      </Menu>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>Please log in to view your orders</Text>
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

  if (loading && page === 1) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator style={styles.loadingMore} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Home')}
              style={styles.shopButton}
            >
              Start Shopping
            </Button>
          </View>
        }
      />
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  list: {
    paddingBottom: 10,
  },
  orderCard: {
    marginHorizontal: 10,
    marginVertical: 6,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  orderDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  reviewButton: {
    marginTop: 8,
  },
  itemsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#333',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  loadingMore: {
    padding: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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

export default OrdersScreen;
