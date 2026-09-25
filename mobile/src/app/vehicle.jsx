import { useState } from 'react';

import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function VehicleScreen() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('');

  const [loading, setLoading] = useState(false);

  async function saveVehicle() {
    if (
      !brand ||
      !model ||
      !colour ||
      !plateNumber ||
      !seatCapacity
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in all fields.'
      );

      return;
    }

    const seats = Number(seatCapacity);

    if (
      Number.isNaN(seats) ||
      seats < 1 ||
      seats > 8
    ) {
      Alert.alert(
        'Invalid seat capacity',
        'Please enter a valid number of seats.'
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          'Not logged in',
          'Please login first.'
        );

        router.replace('/login');

        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('vehicles')
        .insert({
          owner_id: user.id,

          brand: brand.trim(),

          model: model.trim(),

          colour: colour.trim(),

          plate_number:
            plateNumber.trim().toUpperCase(),

          seat_capacity: seats,
        })
        .select()
        .single();

      if (error) {
        Alert.alert(
          'Unable to add vehicle',
          error.message
        );

        return;
      }

      console.log(
        'Vehicle created:',
        data
      );

      Alert.alert(
        'Vehicle added',
        `${brand} ${model} has been added.`,
        [
          {
            text: 'OK',

            onPress: () =>
              router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        Add Vehicle
      </Text>

      <Text style={styles.subtitle}>
        Add the car you will use when offering rides.
      </Text>

      <Text style={styles.label}>
        Brand
      </Text>

      <TextInput
        placeholder="e.g. Toyota"
        value={brand}
        onChangeText={setBrand}
        style={styles.input}
      />

      <Text style={styles.label}>
        Model
      </Text>

      <TextInput
        placeholder="e.g. Vios"
        value={model}
        onChangeText={setModel}
        style={styles.input}
      />

      <Text style={styles.label}>
        Colour
      </Text>

      <TextInput
        placeholder="e.g. White"
        value={colour}
        onChangeText={setColour}
        style={styles.input}
      />

      <Text style={styles.label}>
        Plate Number
      </Text>

      <TextInput
        placeholder="e.g. PAA 1234"
        value={plateNumber}
        onChangeText={setPlateNumber}
        autoCapitalize="characters"
        style={styles.input}
      />

      <Text style={styles.label}>
        Passenger Capacity
      </Text>

      <TextInput
        placeholder="e.g. 4"
        value={seatCapacity}
        onChangeText={setSeatCapacity}
        keyboardType="number-pad"
        style={styles.input}
      />

      <TouchableOpacity
        onPress={saveVehicle}
        disabled={loading}
        style={[
          styles.button,
          loading && {
            opacity: 0.5,
          },
        ]}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Saving...'
            : 'Save Vehicle'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 50,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
  },
});