import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, RadioButton, TextInput, Divider } from 'react-native-paper';
import { addressesAPI } from '../services/api';

const AddressSelector = ({ selectedAddressId, onSelect, onAddNew, allowAddNew = true }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malaysia',
    is_default: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (addresses.length === 0) {
        setShowAddForm(true);
        if (selectedAddressId) onSelect(null); // Clear selection if no addresses
      } else {
        setShowAddForm(false);
        // Auto-select first address if only one exists and none selected
        if (addresses.length === 1 && !selectedAddressId) {
          onSelect(addresses[0].address_id);
        }
      }
    }
  }, [loading, addresses.length, selectedAddressId]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressesAPI.getAll();
      const addressList = Array.isArray(data) ? data : [];
      setAddresses(addressList);
    } catch (e) {
      console.error('Fetch addresses error:', e);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.street_address || !newAddress.city || !newAddress.state || !newAddress.postal_code) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const addedAddress = await addressesAPI.add(newAddress);
      setShowAddForm(false);
      setNewAddress({ street_address: '', city: '', state: '', postal_code: '', country: 'Malaysia', is_default: false });
      await fetchAddresses();
      // Auto-select the newly added address
      if (addedAddress && addedAddress.address_id) {
        onSelect(addedAddress.address_id);
      }
      if (onAddNew) onAddNew();
    } catch (e) {
      console.error('Add address error:', e);
      alert('Failed to add address. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shipping Address</Text>
      {loading ? (
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Loading addresses...</Text>
      ) : addresses.length === 0 && !showAddForm ? (
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>No addresses saved</Text>
      ) : null}
      {addresses.map(addr => (
        <RadioButton.Item
          key={addr.address_id}
          label={`${addr.street_address}, ${addr.city}, ${addr.state} ${addr.postal_code}`}
          value={addr.address_id}
          status={selectedAddressId === addr.address_id ? 'checked' : 'unchecked'}
          onPress={() => onSelect(addr.address_id)}
          style={{ paddingVertical: 4 }}
        />
      ))}
      {allowAddNew && !showAddForm && addresses.length > 0 && (
        <Button mode="outlined" onPress={() => setShowAddForm(true)} style={{ marginTop: 10 }}>Add New Address</Button>
      )}
      {showAddForm && (
        <View style={styles.addForm}>
          <Divider style={{ marginVertical: 8 }} />
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Add New Address</Text>
          <TextInput label="Street Address*" value={newAddress.street_address} onChangeText={t => setNewAddress({ ...newAddress, street_address: t })} style={styles.input} mode="outlined" />
          <TextInput label="City*" value={newAddress.city} onChangeText={t => setNewAddress({ ...newAddress, city: t })} style={styles.input} mode="outlined" />
          <TextInput label="State*" value={newAddress.state} onChangeText={t => setNewAddress({ ...newAddress, state: t })} style={styles.input} mode="outlined" />
          <TextInput label="Postal Code*" value={newAddress.postal_code} onChangeText={t => setNewAddress({ ...newAddress, postal_code: t })} style={styles.input} keyboardType="numeric" mode="outlined" />
          <TextInput label="Country" value={newAddress.country} onChangeText={t => setNewAddress({ ...newAddress, country: t })} style={styles.input} mode="outlined" />
          <Button mode="contained" onPress={handleAddAddress} style={{ marginTop: 8 }}>Save Address</Button>
          {addresses.length > 0 && (
            <Button mode="text" onPress={() => setShowAddForm(false)} style={{ marginTop: 4 }}>Cancel</Button>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontWeight: 'bold', marginBottom: 8 },
  addForm: { marginTop: 10 },
  input: { marginBottom: 6, backgroundColor: 'white' },
});

export default AddressSelector;
