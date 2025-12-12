import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Snackbar, IconButton, Modal, Portal, Button, TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { reviewsAPI } from '../services/api';
import { theme } from '../theme';

const MyReviewsScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchReviews(1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReviews(1);
    }, [])
  );

  const fetchReviews = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const params = { page: pageNum, limit: 20 };
      const response = await reviewsAPI.getMyReviews(params);
      // console.log debug removed
      // Normalize response shape -- some API calls may return { success, data } or directly { reviews }
      const payload = (response && typeof response === 'object')
        ? (response.data || response) // prefer response.data if present
        : null;
      const items = (payload?.reviews) || response?.reviews || [];

      if (append) setReviews(prev => [...prev, ...items]);
      else setReviews(items);

      setPage(pageNum);
      const pagination = payload?.pagination || response?.pagination || {};
      const totalPages = pagination.totalPages || pagination.pages || 0;
      setHasMore(totalPages > pageNum);
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      setSnackbarMessage(error.message || 'Failed to load reviews');
      setSnackbarVisible(true);
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
          <Text style={styles.productName}>{item.product_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            <IconButton icon="pencil" size={18} onPress={() => handleEdit(item)} />
            <IconButton icon="delete" size={18} onPress={() => handleDelete(item.review_id)} />
          </View>
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

    const handleDelete = async (reviewId) => {
      Alert.alert(
        'Delete Review',
        'Are you sure you want to delete this review?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
              try {
                setLoading(true);
                await reviewsAPI.delete(reviewId);
                setSnackbarMessage('Review deleted');
                setSnackbarVisible(true);
                fetchReviews(1);
              } catch (error) {
                console.error('Error deleting review', error);
                setSnackbarMessage(error.message || 'Failed to delete');
                setSnackbarVisible(true);
              } finally {
                setLoading(false);
              }
          } }
        ]
      );
    };

    const handleEdit = (review) => {
      setEditingReview(review);
      setEditRating(review.rating);
      setEditText(review.review_text || '');
      setEditModalVisible(true);
    };

    const submitEdit = async () => {
      if (!editingReview) return;
      try {
        setEditLoading(true);
        await reviewsAPI.update(editingReview.review_id, { rating: editRating, comment: editText });
        setEditModalVisible(false);
        setSnackbarMessage('Review updated');
        setSnackbarVisible(true);
        fetchReviews(1);
      } catch (err) {
        console.error('Error updating review', err);
        setSnackbarMessage(err.message || 'Failed to update');
        setSnackbarVisible(true);
      } finally {
        setEditLoading(false);
      }
    };

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
      <Portal>
        <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.editModal}>
          <Text style={styles.title}>Edit Review</Text>
          <TextInput label="Rating (1-5)" value={String(editRating)} onChangeText={(v) => setEditRating(Number(v))} keyboardType="numeric" />
          <TextInput label="Review" value={editText} onChangeText={setEditText} multiline numberOfLines={4} style={{ marginTop: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Button mode="outlined" onPress={() => setEditModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={submitEdit} loading={editLoading}>Save</Button>
          </View>
        </Modal>
      </Portal>
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>{snackbarMessage}</Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reviewCard: { margin: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: 'bold' },
  reviewDate: { color: '#666', fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  star: { marginRight: 4 },
  reviewText: { color: '#333' },
  editModal: { backgroundColor: 'white', padding: 16, margin: 16, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
});

export default MyReviewsScreen;
