import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { reviewsAPI } from '../services/api';
import { theme } from '../theme';

const AddReviewScreen = ({ route, navigation }) => {
  const { productId, onReviewAdded } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      showSnackbar('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      await reviewsAPI.create({
        product_id: productId,
        rating,
        comment: comment.trim() || undefined,
      });

      showSnackbar('Review submitted successfully!');
      
      // Call callback if provided
      if (onReviewAdded) {
        onReviewAdded();
      }

      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error('Error submitting review:', error);
      showSnackbar(error.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Write a Review</Text>

        <View style={styles.ratingSection}>
          <Text style={styles.label}>Rating *</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={styles.star}>
                  {star <= rating ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 ? 'Tap to rate' : 
             rating === 1 ? 'Poor' :
             rating === 2 ? 'Fair' :
             rating === 3 ? 'Good' :
             rating === 4 ? 'Very Good' :
             'Excellent'}
          </Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.label}>Review (Optional)</Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with this product..."
            style={styles.input}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || rating === 0}
          style={styles.submitButton}
        >
          Submit Review
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  ratingSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  commentSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
});

export default AddReviewScreen;
