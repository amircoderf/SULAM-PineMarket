import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  ActivityIndicator,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { productsAPI, categoriesAPI } from '../../services/api';
import { theme } from '../../theme';

const AddProductScreen = ({ route, navigation }) => {
  const { productId, mode } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit' && productId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [images, setImages] = useState([]);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProductDetails();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      showSnackbar('Failed to load categories');
    }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const product = await productsAPI.getById(productId);
      
      setName(product.product_name || product.name || '');
      setDescription(product.description || '');
      setPrice((product.price || '').toString());
      setCategoryId(product.category_id || '');
      setUnit(product.unit || 'kg');
      setStockQuantity((product.stock_quantity || '').toString());
      setIsOrganic(product.is_organic || false);
      
      if (product.images && product.images.length > 0) {
        setImages(product.images.map(img => ({ uri: img.image_url, existing: true })));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showSnackbar('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => ({ uri: asset.uri, existing: false }));
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showSnackbar('Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (!result.canceled) {
        const newImage = { uri: result.assets[0].uri, existing: false };
        setImages([...images, newImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showSnackbar('Failed to take photo');
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      showSnackbar('Please enter product name');
      return false;
    }
    if (!description.trim()) {
      showSnackbar('Please enter product description');
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      showSnackbar('Please enter a valid price');
      return false;
    }
    if (!categoryId) {
      showSnackbar('Please select a category');
      return false;
    }
    if (!stockQuantity || parseInt(stockQuantity) < 0) {
      showSnackbar('Please enter a valid stock quantity');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const productData = {
        productName: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        categoryId: categoryId,
        unit,
        stockQuantity: parseInt(stockQuantity),
        isOrganic: isOrganic,
      };

      // Note: Image upload functionality requires backend multipart/form-data support
      // For now, we'll just save product data without images
      // TODO: Implement image upload with FormData

      if (isEditMode) {
        await productsAPI.update(productId, productData);
        showSnackbar('Product updated successfully!');
      } else {
        await productsAPI.create(productData);
        showSnackbar('Product created successfully!');
      }

      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error('Error saving product:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </Text>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.productImage} />
                  <IconButton
                    icon="close-circle"
                    size={24}
                    iconColor="white"
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  />
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}
              >
                <Text style={styles.addImageIcon}>+</Text>
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <Text style={styles.helperText}>
            Note: Image upload feature is in development
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <TextInput
            label="Product Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
                style={styles.categoryChip}
              >
                {category.name}
              </Chip>
            ))}
          </View>
        </View>

        {/* Pricing & Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Stock</Text>
          
          <TextInput
            label="Price (RM) *"
            value={price}
            onChangeText={setPrice}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              label="Stock Quantity *"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              mode="outlined"
              keyboardType="number-pad"
              style={[styles.input, styles.halfInput]}
            />

            <TextInput
              label="Unit"
              value={unit}
              onChangeText={setUnit}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          
          <Chip
            selected={isOrganic}
            onPress={() => setIsOrganic(!isOrganic)}
            icon="leaf"
            style={styles.organicChip}
          >
            Organic Product
          </Chip>
        </View>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
          style={styles.submitButton}
        >
          {isEditMode ? 'Update Product' : 'Create Product'}
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageIcon: {
    fontSize: 36,
    color: '#999',
  },
  addImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  organicChip: {
    alignSelf: 'flex-start',
  },
  submitButton: {
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 20,
  },
});

export default AddProductScreen;
