import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  ActivityIndicator,
  Snackbar,
  Portal,
  Modal,
} from 'react-native-paper';
import { productsAPI, favoritesAPI, reviewsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchProductDetails();
    fetchReviews();
    if (isAuthenticated) {
      checkFavoriteStatus();
    }
  }, [productId, isAuthenticated]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getById(productId);
      const productData = data?.product || data;
      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      showSnackbar('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoritesAPI.check(productId);
      setIsFavorite(response.data?.isFavorite || false);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await reviewsAPI.getByProduct(productId, { limit: 5 });
      setReviews(response.data?.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddReview = () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    navigation.navigate('AddReview', { productId, onReviewAdded: fetchReviews });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    if (quantity > product.stock_quantity) {
      showSnackbar('Not enough stock available');
      return;
    }

    try {
      const result = await addToCart(productId, quantity);
      if (result.success) {
        showSnackbar('Added to cart successfully!');
      } else {
        showSnackbar(result.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showSnackbar(error.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    try {
      await addToCart(productId, quantity);
      navigation.navigate('Cart');
    } catch (error) {
      showSnackbar('Failed to proceed to cart');
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    try {
      if (isFavorite) {
        await favoritesAPI.remove(productId);
        setIsFavorite(false);
        showSnackbar('Removed from favorites');
      } else {
        await favoritesAPI.add(productId);
        setIsFavorite(true);
        showSnackbar('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showSnackbar(error.message || 'Failed to update favorites');
    }
  };

  const incrementQuantity = () => {
    if (product && product.stock_quantity && quantity < product.stock_quantity) {
      setQuantity(prev => prev + 1);
    } else {
      // debug: cannot increment - exceeds stock or no product
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const renderImageGallery = () => {
    const images = product.images && product.images.length > 0
      ? product.images
      : [{ image_url: null, is_primary: true }];

    return (
      <View>
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          {images[selectedImageIndex]?.image_url ? (
            <Image
              source={{ uri: images[selectedImageIndex].image_url }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.mainImage, styles.placeholderImage]}>
              <Text style={styles.placeholderEmoji}>🍍</Text>
            </View>
          )}
        </TouchableOpacity>

        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImageIndex(index)}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.thumbnailSelected,
                ]}
              >
                {image.image_url ? (
                  <Image
                    source={{ uri: image.image_url }}
                    style={styles.thumbnailImage}
                  />
                ) : (
                  <View style={[styles.thumbnailImage, styles.placeholderThumbnail]}>
                    <Text style={styles.thumbnailEmoji}>🍍</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text>Product not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {renderImageGallery()}

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.productName}>{product.product_name}</Text>
              {product.is_organic && (
                <Chip icon="leaf" style={styles.organicChip}>
                  Organic
                </Chip>
              )}
            </View>
            <IconButton
              icon={isFavorite ? 'heart' : 'heart-outline'}
              iconColor={isFavorite ? '#e74c3c' : '#666'}
              size={28}
              onPress={handleToggleFavorite}
            />
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.rating}>
              ⭐ {(Number(product.rating_average) || 0).toFixed(1)}
            </Text>
            <Text style={styles.ratingCount}>
              ({product.total_reviews || 0} reviews)
            </Text>
            <Text style={styles.sales}>• {product.total_sales || 0} sold</Text>
          </View>

          <Text style={styles.price}>RM{parseFloat(product.price).toFixed(2)}</Text>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit:</Text>
              <Text style={styles.detailValue}>{product.unit}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={[
                styles.detailValue,
                product.stock_quantity === 0 && styles.outOfStock,
              ]}>
                {product.stock_quantity > 0
                  ? `${product.stock_quantity} available`
                  : 'Out of stock'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seller:</Text>
              <Text style={styles.detailValue}>
                {product.seller_name || 'Unknown'}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
              <Button mode="outlined" onPress={handleAddReview} compact>
                Write Review
              </Button>
            </View>
            
            {reviewsLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : reviews.length > 0 ? (
              <>
                {reviews.map((review, index) => (
                  <View key={review.review_id || index} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>
                        {review.first_name} {review.last_name}
                      </Text>
                      <View style={styles.reviewRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text key={star} style={styles.star}>
                            {star <= review.rating ? '⭐' : '☆'}
                          </Text>
                        ))}
                      </View>
                    </View>
                    {review.review_text && (
                      <Text style={styles.reviewText}>{review.review_text}</Text>
                    )}
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
                {(product?.total_reviews || 0) > reviews.length && (
                  <Button 
                    mode="text" 
                    onPress={() => navigation.navigate('ProductReviews', { productId })}
                  >
                    Show more...
                  </Button>
                )}
              </>
            ) : (
              <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              onPress={decrementQuantity}
              disabled={quantity <= 1}
            />
            <Text style={styles.quantityText}>{quantity}</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={incrementQuantity}
              disabled={!product || quantity >= product.stock_quantity}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleAddToCart}
            style={styles.addToCartButton}
            disabled={product.stock_quantity === 0}
          >
            Add to Cart
          </Button>
          <Button
            mode="contained"
            onPress={handleBuyNow}
            style={styles.buyButton}
            disabled={product.stock_quantity === 0}
          >
            Buy Now
          </Button>
        </View>
      </View>

      <Portal>
        <Modal
          visible={imageModalVisible}
          onDismiss={() => setImageModalVisible(false)}
          contentContainerStyle={styles.imageModal}
        >
          {product.images?.[selectedImageIndex]?.image_url ? (
            <Image
              source={{ uri: product.images[selectedImageIndex].image_url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.fullImagePlaceholder}>
              <Text style={styles.fullImageEmoji}>🍍</Text>
            </View>
          )}
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: width,
    height: width,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 120,
  },
  thumbnailContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  thumbnail: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  thumbnailSelected: {
    borderColor: theme.colors.primary,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  placeholderThumbnail: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailEmoji: {
    fontSize: 30,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  organicChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  sales: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  outOfStock: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 12,
    marginLeft: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  noReviews: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
    backgroundColor: 'white',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    marginRight: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
  },
  buyButton: {
    flex: 1,
  },
  imageModal: {
    backgroundColor: 'black',
    height: '100%',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  fullImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageEmoji: {
    fontSize: 200,
  },
});

export default ProductDetailScreen;
