import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { addressesAPI } from '../services/api';
import AddressSelector from './AddressSelector';
import { MaterialIcons } from '@expo/vector-icons';

const AddressSummaryCard = ({ selectedAddressId, onSelect, onAddNew }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId) {
      const found = addresses.find(a => a.address_id === selectedAddressId);
      setSelectedAddress(found);
    } else if (addresses.length > 0) {
      setSelectedAddress(addresses[0]);
      onSelect(addresses[0].address_id);
    } else {
      setSelectedAddress(null);
    }
  }, [addresses, selectedAddressId]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressesAPI.getAll();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => {
    onSelect(id);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Deliver to</Text>
      <Card style={styles.card}>
        <View style={styles.row}>
          <MaterialIcons name="location-on" size={24} color="#FFB300" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            {loading ? (
              <ActivityIndicator size="small" />
            ) : selectedAddress ? (
              <Text style={styles.addressText} numberOfLines={2}>
                {selectedAddress.street_address}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
              </Text>
            ) : (
              <Text style={styles.addressText}>No address selected</Text>
            )}
          </View>
          <Button mode="text" onPress={() => setModalVisible(true)} style={styles.changeBtn} compact>
            {addresses.length === 0 ? 'Add' : 'Change'}
          </Button>
        </View>
      </Card>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AddressSelector
              selectedAddressId={selectedAddressId}
              onSelect={handleSelect}
              onAddNew={fetchAddresses}
              allowAddNew={true}
            />
            <Button mode="text" onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>Close</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontWeight: 'bold', marginBottom: 4, fontSize: 15 },
  card: { padding: 12, borderRadius: 10, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 15, color: '#333' },
  changeBtn: { marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
});

export default AddressSummaryCard;
