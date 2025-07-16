import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const VendorScreen = () => {
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    ctaText: '',
    ctaLink: ''
  });

  const fetchVendorCall = async () => {
    try {
      const res = await axios.get('/api/homescreen/vendor-call');
      setVendor(res.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const saveVendorCall = async () => {
    try {
      await axios.post('/api/homescreen/vendor-call', form);
      fetchVendorCall();
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchVendorCall();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vendor Call</Text>
      {vendor && (
        <View>
          <Text>{vendor.title}</Text>
          <Text>{vendor.content}</Text>
        </View>
      )}

      <TextInput
        placeholder="Title"
        style={styles.input}
        value={form.title}
        onChangeText={(val) => setForm({ ...form, title: val })}
      />
      <TextInput
        placeholder="Content"
        style={styles.input}
        value={form.content}
        onChangeText={(val) => setForm({ ...form, content: val })}
      />
      <TextInput
        placeholder="CTA Text"
        style={styles.input}
        value={form.ctaText}
        onChangeText={(val) => setForm({ ...form, ctaText: val })}
      />
      <TextInput
        placeholder="CTA Link"
        style={styles.input}
        value={form.ctaLink}
        onChangeText={(val) => setForm({ ...form, ctaLink: val })}
      />
      <Button title="Save" onPress={saveVendorCall} />
    </View>
  );
};

export default VendorScreen;

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold' },
  input: { borderBottomWidth: 1, marginVertical: 10, padding: 8 },
});
