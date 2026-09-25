import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

export default function VehicleScreen() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('');

  function saveVehicle() {
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

    const vehicle = {
      brand,
      model,
      colour,
      plateNumber,
      seatCapacity: Number(seatCapacity),
    };

    console.log('Vehicle:', vehicle);

    Alert.alert(
      'Vehicle saved',
      `${brand} ${model} has been added.`
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Vehicle</Text>

      <TextInput
        placeholder="Brand e.g. Toyota"
        value={brand}
        onChangeText={setBrand}
        style={styles.input}
      />

      <TextInput
        placeholder="Model e.g. Vios"
        value={model}
        onChangeText={setModel}
        style={styles.input}
      />

      <TextInput
        placeholder="Colour"
        value={colour}
        onChangeText={setColour}
        style={styles.input}
      />

      <TextInput
        placeholder="Plate number"
        value={plateNumber}
        onChangeText={setPlateNumber}
        autoCapitalize="characters"
        style={styles.input}
      />

      <TextInput
        placeholder="Seat capacity"
        value={seatCapacity}
        onChangeText={setSeatCapacity}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity
        onPress={saveVehicle}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          Save Vehicle
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  container: {
    padding: 24,
    gap: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
  },

  button: {
    marginTop: 10,
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 10,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
};