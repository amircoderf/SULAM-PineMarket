import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, ActivityIndicator, Button, Card } from 'react-native-paper';
import { reviewsAPI } from '../services/api';

const ProductReviewsModal = ({ visible, onDismiss, productId, productName }) => {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!visible) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await reviewsAPI.getByProduct(productId, { limit: 100 });
        // api interceptors return .data
        setReviews(res?.data?.reviews || []);
      } catch (e) {
        console.error('Error loading reviews', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [visible, productId]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>{productName} — Reviews</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View>
            {reviews.length === 0 ? (
              <Text>No reviews found</Text>
            ) : (
              reviews.map(r => (
                <Card style={styles.card} key={r.review_id}>
                  <Card.Content>
                    <Text style={styles.reviewer}>{(r.user_first_name || '') + ' ' + (r.user_last_name || '')}</Text>
                    <Text>{r.review_text}</Text>
                    <Text style={styles.rating}>Rating: {Number(r.rating) || 0}</Text>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}
        <Button mode="contained" onPress={onDismiss} style={{ marginTop: 12 }}>Close</Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', padding: 16, margin: 16, borderRadius: 8 },
  title: { marginBottom: 8 },
  card: { marginBottom: 8 },
  reviewer: { fontWeight: 'bold', marginBottom: 4 },
  rating: { marginTop: 6, color: '#444' },
});

export default ProductReviewsModal;
