import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

export default function CreateRideScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  function createRide() {
    if (
      !origin ||
      !destination ||
      !date ||
      !time ||
      !seats ||
      !price
    ) {
      Alert.alert(
        'Missing information',
        'Please complete the required fields.'
      );
      return;
    }

    const ride = {
      origin,
      destination,
      date,
      time,
      seats: Number(seats),
      price: Number(price),
      notes,
    };

    console.log('Ride created:', ride);

    Alert.alert(
      'Ride created',
      `${origin} → ${destination}`
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Offer a Ride
      </Text>

      <TextInput
        placeholder="From"
        value={origin}
        onChangeText={setOrigin}
        style={styles.input}
      />

      <TextInput
        placeholder="To"
        value={destination}
        onChangeText={setDestination}
        style={styles.input}
      />

      <TextInput
        placeholder="Date e.g. 28/09/2026"
        value={date}
        onChangeText={setDate}
        style={styles.input}
      />

      <TextInput
        placeholder="Time e.g. 6:00 PM"
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      <TextInput
        placeholder="Available seats"
        value={seats}
        onChangeText={setSeats}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Price per seat (RM)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={[
          styles.input,
          {
            height: 100,
            textAlignVertical: 'top',
          },
        ]}
      />

      <TouchableOpacity
        onPress={createRide}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          Publish Ride
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