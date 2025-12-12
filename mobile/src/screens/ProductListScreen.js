import React, { useState, useEffect } from 'react';
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
  Searchbar,
  Chip,
  FAB,
  ActivityIndicator,
  Button,
  IconButton,
  Menu,
} from 'react-native-paper';
import { productsAPI, categoriesAPI } from '../services/api';
import { theme } from '../theme';

const ProductListScreen = ({ navigation, route }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [organicOnly, setOrganicOnly] = useState(false);

  // Get category from navigation params if available


  // Set initial category from route params if present
  useEffect(() => {
    fetchCategories();
    if (route?.params?.category) {
      setSelectedCategory(
        categories.find(c => c.name === route.params.category)?.id || null
      );
    }
  }, [route?.params?.category, categories.length]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, sortOrder, organicOnly, searchQuery]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 10,
        sortBy,
        sortOrder,
        search: searchQuery,
        category: selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : undefined,
        isOrganic: organicOnly || undefined,
      };

      const data = await productsAPI.getAll(params);
      if (append) {
        setProducts([...products, ...(data?.products || [])]);
      } else {
        setProducts(data?.products || []);
      }
      setHasMore(data?.pagination?.page < data?.pagination?.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1, true);
    }
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.product_id });
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleProductPress(item)}
      style={styles.productCard}
    >
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>🍍</Text>
            </View>
          )}
          
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.product_name}
            </Text>
            
            {item.is_organic && (
              <Chip
                icon="leaf"
                style={styles.organicChip}
                textStyle={styles.organicChipText}
              >
                Organic
              </Chip>
            )}
            
            <View style={styles.ratingRow}>
              <Text style={styles.rating}>⭐ {(Number(item.rating_average) || 0).toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({item.total_reviews || 0})</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.price}>RM{parseFloat(item.price).toFixed(2)}</Text>
              <Text style={styles.stock}>
                {item.stock_quantity > 0 ? `${item.stock_quantity} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder="Search pineapple products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filterRow}>
        <View style={styles.filterButtons}>
          <Button
            mode={organicOnly ? 'contained' : 'outlined'}
            onPress={() => setOrganicOnly(!organicOnly)}
            style={styles.filterButton}
            compact
          >
            🌿 Organic
          </Button>
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSortMenuVisible(true)}
                style={styles.filterButton}
                compact
              >
                Sort: {sortBy === 'created_at' ? 'Newest' : sortBy === 'price' ? 'Price' : 'Rating'}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSortBy('created_at'); setSortMenuVisible(false); }} title="Newest" />
            <Menu.Item onPress={() => { setSortBy('price'); setSortMenuVisible(false); }} title="Price" />
            <Menu.Item onPress={() => { setSortBy('rating_average'); setSortMenuVisible(false); }} title="Rating" />
            <Menu.Item onPress={() => { setSortBy('total_sales'); setSortMenuVisible(false); }} title="Popular" />
          </Menu>
          
          <Button
            mode="outlined"
            onPress={toggleSortOrder}
            style={styles.filterButton}
            compact
            icon={sortOrder === 'DESC' ? 'arrow-down' : 'arrow-up'}
          >
            {sortOrder === 'DESC' ? 'Desc' : 'Asc'}
          </Button>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <Chip
            selected={selectedCategory === item.id}
            onPress={() => handleCategoryPress(item.id)}
            style={styles.categoryChip}
          >
            {item.name}
          </Chip>
        )}
      />
    </View>
  );

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
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.product_id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator style={styles.loadingMore} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
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
  },
  header: {
    backgroundColor: 'white',
    paddingBottom: 10,
  },
  searchbar: {
    margin: 10,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    marginRight: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  categoryChip: {
    marginRight: 8,
  },
  productCard: {
    marginHorizontal: 10,
    marginVertical: 6,
  },
  card: {
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  organicChip: {
    alignSelf: 'flex-start',
    height: 24,
    marginVertical: 4,
  },
  organicChipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  stock: {
    fontSize: 12,
    color: '#666',
  },
  loadingMore: {
    padding: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ProductListScreen;
