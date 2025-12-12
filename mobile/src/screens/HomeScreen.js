import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator, Card, Button } from 'react-native-paper';
import { productsAPI, categoriesAPI } from '../services/api';
import { theme, spacing } from '../theme';

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsAPI.getAll({ limit: 10, sortBy: 'created_at' }),
        categoriesAPI.getAll(),
      ]);

      // Data is already unwrapped by the API service
      setProducts(productsData?.products || []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSearch = () => {
    navigation.navigate('ProductList', { search: searchQuery });
  };

  const handleCategoryPress = (categoryName) => {
    setSelectedCategory(categoryName);
    navigation.navigate('ProductList', { category: categoryName });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome to PineMarket! 🍍</Text>
        <Text style={styles.subtitle}>Find the best pineapple products</Text>
      </View>

      <Searchbar
        placeholder="Search products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchbar}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.name}
              onPress={() => handleCategoryPress(category.name)}
              style={styles.chip}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('ProductList')}
          >
            View All
          </Button>
        </View>

        {products.map((product) => (
          <Card
            key={product.product_id}
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { productId: product.product_id })}
          >
            <Card.Content>
              <Text style={styles.productName}>{product.product_name}</Text>
              <Text style={styles.productPrice}>RM{parseFloat(product.price).toFixed(2)}</Text>
              {product.is_organic && (
                <Chip icon="leaf" style={styles.organicChip} compact>
                  Organic
                </Chip>
              )}
              <Text numberOfLines={2} style={styles.productDescription}>
                {product.description}
              </Text>
              <View style={styles.productMeta}>
                <Text style={styles.metaText}>⭐ {product.rating_average || 0}</Text>
                <Text style={styles.metaText}>📦 {product.stock_quantity} in stock</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  searchbar: {
    margin: spacing.md,
    elevation: 2,
  },
  section: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  chip: {
    marginRight: spacing.sm,
  },
  productCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  organicChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  productDescription: {
    color: theme.colors.placeholder,
    marginBottom: spacing.sm,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: theme.colors.placeholder,
  },
});

export default HomeScreen;
