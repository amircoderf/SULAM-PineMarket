import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Avatar, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
// removed duplicate useEffect import above
import { useFocusEffect } from '@react-navigation/native';
import { reviewsAPI } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [myReviewsCount, setMyReviewsCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
    // fetch reviews count
    (async () => {
      try {
        const res = await reviewsAPI.getMyReviews({ page: 1, limit: 1 });
        const payload = res?.data || res;
        const total = payload?.pagination?.totalReviews || payload?.pagination?.total || 0;
        setMyReviewsCount(total);
      } catch (e) {
        // ignore
      }
    })();
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await reviewsAPI.getMyReviews({ page: 1, limit: 1 });
          const payload = res?.data || res;
          const total = payload?.pagination?.totalReviews || payload?.pagination?.total || 0;
          setMyReviewsCount(total);
        } catch (e) {
          // ignore
        }
      })();
    }, [])
  );

  const handleLogout = async () => {
    await logout();
    // isAuthenticated will become false, triggering useEffect
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          {user?.avatar ? (
            <Avatar.Image size={84} source={{ uri: user.avatar }} />
          ) : (
            <Avatar.Text size={84} label={(user?.firstName || 'U').charAt(0)} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.smallStat}>Reviews: {myReviewsCount}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actionsRow}>
        <Button mode="contained" onPress={() => navigation.navigate('EditProfile')} style={styles.actionButton}>
          Edit Profile
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('Orders')} style={styles.actionButton}>
          My Orders
        </Button>
      </View>

      <View style={styles.actionsRow}>
        <Button mode="outlined" onPress={() => navigation.navigate('Favorites')} style={styles.actionButton}>
          My Favorites
        </Button>
            <Button mode="outlined" onPress={() => navigation.navigate('MyReviews')} style={styles.actionButton}>
          My Reviews {myReviewsCount ? `(${myReviewsCount})` : ''}
        </Button>
      </View>

      {user?.userType === 'seller' || user?.userType === 'both' ? (
        <View style={styles.actionsRow}>
          <Button mode="contained" onPress={() => navigation.navigate('Seller')} style={styles.actionButton}>
            Seller Dashboard
          </Button>
        </View>
      ) : null}

      <Button mode="contained" onPress={handleLogout} style={[styles.button, { marginTop: 20 }]}>Logout</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  button: {
    marginTop: 10,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  email: {
    color: '#666',
  },
  phone: {
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  smallStat: {
    color: '#666',
    marginTop: 4,
  },
});

export default ProfileScreen;
