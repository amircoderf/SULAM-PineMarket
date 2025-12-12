import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Divider, Chip } from 'react-native-paper';
import { reviewsAPI } from '../services/api';
import { theme } from '../theme';

const ProductReviewsScreen = ({ route }) => {
  const { productId } = route.params || {};
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReviews(1);
  }, [productId]);

  const fetchReviews = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const params = { page: pageNum, limit: 20 };
      const response = await reviewsAPI.getByProduct(productId, params);
      // debug logs removed
      const payload = (response && typeof response === 'object') ? (response.data || response) : null;
      const items = (payload?.reviews) || response?.reviews || [];

      if (append) setReviews(prev => [...prev, ...items]);
      else setReviews(items);

      setPage(pageNum);
      const pagination = payload?.pagination || response?.pagination || {};
      const totalPages = pagination.totalPages || pagination.pages || 0;
      setHasMore(totalPages > pageNum);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchReviews(page + 1, true);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.reviewerName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={styles.star}>{i < item.rating ? '⭐' : '☆'}</Text>
          ))}
          <Text style={styles.reviewText}>{`  ${item.review_text || ''}`}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item.review_id?.toString() || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text>No reviews yet.</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reviewCard: { margin: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 16, fontWeight: 'bold' },
  reviewDate: { color: '#666', fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  star: { marginRight: 4 },
  reviewText: { color: '#333' },
});

export default ProductReviewsScreen;
