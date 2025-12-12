import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  IconButton,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { productsAPI, sellerAPI } from '../../services/api';
import RevenueChart from '../../components/RevenueChart';
import ProductReviewsModal from '../../components/ProductReviewsModal';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

const SellerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    topProducts: [],
    monthlyRevenue: [],
  });
  const [selectedStatsMonth, setSelectedStatsMonth] = useState(null);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const selectedMonthKey = useMemo(() => {
    if (!selectedStatsMonth?.month) return null;
    const mk = (m) => {
      if (!m) return null;
      if (typeof m === 'string' && /^\d{4}-\d{2}$/.test(m)) return m;
      const d = new Date(m);
      return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    };
    return mk(selectedStatsMonth.month);
  }, [selectedStatsMonth]);

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      
      // Fetch seller's products only
      const data = await productsAPI.getAll({ 
        limit: 100,
        sortBy: 'created_at',
        sellerId: user?.id,
      });
      
      const myProducts = data?.products || [];
      setProducts(myProducts);

      // Fetch seller stats (includes real revenue from orders)
      try {
        const statsData = await sellerAPI.getStats();
        setStats({
          totalProducts: statsData.totalProducts || 0,
          activeProducts: statsData.activeProducts || 0,
          totalSales: statsData.totalSales || 0,
          totalRevenue: statsData.totalRevenue || 0,
          topProducts: statsData.topProducts || [],
          monthlyRevenue: statsData.monthlyRevenue || [],
        });
        // default to first (latest) monthly revenue if available
        if (Array.isArray(statsData.monthlyRevenue) && statsData.monthlyRevenue.length > 0) {
          setSelectedStatsMonth(statsData.monthlyRevenue[0]);
        } else {
          setSelectedStatsMonth(null);
        }
      } catch (statsError) {
        console.error('Error fetching stats:', statsError);
        // Fallback to calculated stats from products
        const active = myProducts.filter(p => p.stock_quantity > 0).length;
        const totalSales = myProducts.reduce((sum, p) => sum + (p.total_sales || 0), 0);
        const totalRevenue = myProducts.reduce((sum, p) => 
          sum + ((p.total_sales || 0) * parseFloat(p.price)), 0
        );
        
        setStats({
          totalProducts: myProducts.length,
          activeProducts: active,
          totalSales,
          totalRevenue,
          topProducts: [],
          monthlyRevenue: [],
        });
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSellerData();
  };

  const handleEditProduct = (productId) => {
    if (!productId) {
      setSnackbarMessage('Invalid product ID');
      setSnackbarVisible(true);
      return;
    }
    navigation.navigate('AddProduct', { productId: productId.toString(), mode: 'edit' });
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsAPI.delete(productId);
              setSnackbarMessage('Product deleted successfully');
              setSnackbarVisible(true);
              await fetchSellerData();
            } catch (error) {
              console.error('Error deleting product:', error);
              setSnackbarMessage(error.response?.data?.message || 'Failed to delete product');
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
      </Card>

      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{stats.activeProducts}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </Card>

      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{stats.totalSales}</Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
      </Card>

      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>RM{stats.totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </Card>
          <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>RM{(selectedStatsMonth ? (parseFloat(selectedStatsMonth.revenue) || 0) : 0).toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue ({selectedStatsMonth ? (() => { const m = selectedStatsMonth.month; if (typeof m === 'string' && /^\d{4}-\d{2}$/.test(m)) { const [y, mm] = m.split('-'); return new Date(Number(y), Number(mm)-1).toLocaleString('default', { month: 'short', year: 'numeric' }); } return new Date(m).toLocaleString('default', { month: 'short', year: 'numeric' }); })() : 'This month'})</Text>
        </View>
      </Card>
    </View>
  );

  const renderProduct = ({ item }) => {
    // Find revenue data for this product from stats
    const productStats = stats.topProducts?.find(p => p.product_id === item.product_id);
    const revenue = Number(productStats?.revenue) || 0;
    const unitsSold = Number(productStats?.units_sold) || Number(item.total_sales) || 0;

    return (
      <Card style={styles.productCard}>
        <View style={styles.productContent}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>🍍</Text>
            </View>
          )}

          <View style={styles.productInfo}>
            <View style={styles.productInfoTopRow}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.product_name}
              </Text>
              <View style={styles.productActions}>
                <IconButton
                  icon="cart"
                  size={22}
                  onPress={() => navigation.navigate('SellerOrders', { productId: item.product_id })}
                />
                <IconButton
                  icon="message"
                  size={22}
                  onPress={() => { setSelectedProductForReviews(item); setReviewsModalVisible(true); }}
                />
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditProduct(item.product_id)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDeleteProduct(item.product_id)}
                />
              </View>
            </View>
            
            <View style={styles.productMeta}>
              <Text style={styles.price}>RM{parseFloat(item.price).toFixed(2)}</Text>
              {item.stock_quantity === 0 ? (
                <Chip style={styles.outOfStockChip} textStyle={styles.chipText}>
                  Out of Stock
                </Chip>
              ) : (
                <Chip style={styles.inStockChip} textStyle={styles.chipText}>
                  {item.stock_quantity} in stock
                </Chip>
              )}
            </View>

            <View style={styles.productStats}>
              <Text style={styles.statsText}>⭐ {(Number(item.rating_average) || 0).toFixed(1)}</Text>
              <Text style={styles.statsText}>• {unitsSold} sold</Text>
              <Text style={styles.statsText}>• RM{revenue.toFixed(2)} revenue</Text>
            </View>
          </View>
          
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Seller Dashboard</Text>
          <Text style={styles.subtitle}>Manage your products and sales</Text>
        </View>

        {renderStats()}
        <View style={{ marginHorizontal: 10 }}>
          {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
            <Card style={styles.chartCard}>
              <Card.Content>
                <RevenueChart collapsible defaultCollapsed={false} monthlyRevenue={stats.monthlyRevenue} selectedMonthKey={selectedMonthKey} onMonthSelect={(monthKey) => {
                    // monthKey format YYYY-MM
                    const mk = (d) => {
                      if (!d) return null;
                      if (typeof d === 'string' && /^\d{4}-\d{2}$/.test(d)) return d;
                      const dt = new Date(d);
                      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                    };
                    const selected = stats.monthlyRevenue.find(m => mk(m.month) === monthKey);
                    setSelectedStatsMonth(selected || null);
                  }} />
              </Card.Content>
            </Card>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="package-variant"
            onPress={() => navigation.navigate('SellerOrders')}
            style={styles.actionButton}
          >
            Customer Orders
          </Button>
        </View>

        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Products</Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate('AddProduct', { mode: 'add' })}
            >
              Add Product
            </Button>
          </View>

          {products.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No products yet</Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddProduct', { mode: 'add' })}
                  style={styles.addButton}
                >
                  Add Your First Product
                </Button>
              </View>
            </Card>
          ) : (
              <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.product_id.toString()}
              scrollEnabled={false}
                extraData={selectedProductForReviews}
            />
          )}
        </View>
      </ScrollView>

      
      <ProductReviewsModal
        visible={reviewsModalVisible}
        onDismiss={() => { setReviewsModalVisible(false); setSelectedProductForReviews(null); }}
        productId={selectedProductForReviews?.product_id}
        productName={selectedProductForReviews?.product_name}
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
  },
  actionButtons: {
    padding: 16,
    backgroundColor: '#fff',
  },
  actionButton: {
    marginBottom: 8,
    borderRadius: 8,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.primary,
    elevation: 3,
  },
  actionButtonContent: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    elevation: 2,
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  productsSection: {
    padding: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productCard: {
    marginBottom: 10,
    elevation: 2,
  },
  productContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 30,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productInfoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    flex: 1,
    marginRight: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  inStockChip: {
    height: 24,
    backgroundColor: '#d4edda',
  },
  outOfStockChip: {
    height: 24,
    backgroundColor: '#f8d7da',
  },
  chipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  productStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  emptyCard: {
    elevation: 2,
  },
  emptyContent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 20,
  },
});

export default SellerDashboardScreen;
