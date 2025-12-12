import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.firstName || user?.first_name || '',
    last_name: user?.lastName || user?.last_name || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      };
      const response = await authAPI.updateProfile(payload);
      if (response.success) {
        updateUser(response.data?.user || payload);
        navigation.goBack();
      } else {
        setSnackbarMessage(response.message || 'Failed to update profile');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to update profile');
      setSnackbarVisible(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TextInput
        label="First name"
        mode="outlined"
        value={formData.first_name}
        onChangeText={(v) => handleChange('first_name', v)}
        style={styles.input}
      />
      <TextInput
        label="Last name"
        mode="outlined"
        value={formData.last_name}
        onChangeText={(v) => handleChange('last_name', v)}
        style={styles.input}
      />
      <TextInput
        label="Phone"
        mode="outlined"
        value={formData.phone}
        onChangeText={(v) => handleChange('phone', v)}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleSave} loading={saving} style={styles.button}>
        Save
      </Button>
      <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.button}>
        Cancel
      </Button>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>{snackbarMessage}</Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
});

export default EditProfileScreen;
