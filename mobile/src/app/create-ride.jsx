import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { supabase } from '../lib/supabase';

export default function CreateRideScreen() {
  const params = useLocalSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const [originLatitude, setOriginLatitude] = useState(null);
  const [originLongitude, setOriginLongitude] = useState(null);

  const [destinationLatitude, setDestinationLatitude] = useState(null);
  const [destinationLongitude, setDestinationLongitude] = useState(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load driver's vehicles
  useEffect(() => {
    loadVehicles();
  }, []);

  // Receive location selected from location-picker.jsx
  useEffect(() => {
    if (
      !params.type ||
      !params.latitude ||
      !params.longitude
    ) {
      return;
    }

    const latitude =
      Number(params.latitude);

    const longitude =
      Number(params.longitude);

    const selectedPlaceName =
      params.placeName
        ? String(params.placeName)
        : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return;
    }

    if (params.type === 'origin') {
      setOriginLatitude(latitude);
      setOriginLongitude(longitude);

      setOrigin(selectedPlaceName);
    }

    if (params.type === 'destination') {
      setDestinationLatitude(latitude);
      setDestinationLongitude(longitude);

      setDestination(selectedPlaceName);
    }
  }, [
    params.type,
    params.latitude,
    params.longitude,
    params.placeName,
  ]);

  async function loadVehicles() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', user.id);

    if (error) {
      Alert.alert(
        'Error',
        'Unable to load vehicles.'
      );

      console.log(
        'Vehicle error:',
        error.message
      );

      setLoadingVehicles(false);
      return;
    }

    setVehicles(data || []);

    if (data && data.length > 0) {
      setSelectedVehicle(data[0]);
    }

    setLoadingVehicles(false);
  }

  async function createRide() {
    if (!selectedVehicle) {
      Alert.alert(
        'No vehicle',
        'Please add a vehicle before offering a ride.'
      );
      return;
    }

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
        'Please complete all required fields.'
      );
      return;
    }

    if (
      originLatitude === null ||
      originLongitude === null ||
      destinationLatitude === null ||
      destinationLongitude === null
    ) {
      Alert.alert(
        'Missing location',
        'Please select both origin and destination on the map.'
      );
      return;
    }

    const seatNumber = Number(seats);
    const priceNumber = Number(price);

    if (
      Number.isNaN(seatNumber) ||
      seatNumber < 1
    ) {
      Alert.alert(
        'Invalid seats',
        'Please enter a valid number of seats.'
      );
      return;
    }

    if (
      seatNumber >
      selectedVehicle.seat_capacity
    ) {
      Alert.alert(
        'Too many seats',
        `This vehicle supports only ${selectedVehicle.seat_capacity} passenger seats.`
      );
      return;
    }

    if (
      Number.isNaN(priceNumber) ||
      priceNumber < 0
    ) {
      Alert.alert(
        'Invalid price',
        'Please enter a valid price.'
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('rides')
        .insert({
          driver_id: user.id,
          vehicle_id: selectedVehicle.id,

          origin: origin.trim(),
          origin_latitude: originLatitude,
          origin_longitude: originLongitude,

          destination: destination.trim(),
          destination_latitude: destinationLatitude,
          destination_longitude: destinationLongitude,

          departure_date: date,
          departure_time: time,

          available_seats: seatNumber,
          price_per_seat: priceNumber,

          notes: notes.trim(),
          status: 'available',
        })
        .select()
        .single();

      if (error) {
        console.log(
          'CREATE RIDE ERROR:',
          error
        );

        Alert.alert(
          'Unable to create ride',
          error.message
        );

        return;
      }

      console.log(
        'SUPABASE RIDE CREATED:',
        data
      );

      Alert.alert(
        'Ride created',
        `${origin} → ${destination}`,
        [
          {
            text: 'View Rides',
            onPress: () =>
              router.replace('/find-ride'),
          },
        ]
      );
    } catch (error) {
      console.log(
        'Unexpected ride error:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingVehicles) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading vehicles...
        </Text>
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noVehicleTitle}>
          No vehicle registered
        </Text>

        <Text style={styles.noVehicleText}>
          Add a vehicle before offering a ride.
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push('/vehicle')
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Add Vehicle
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        Offer a Ride
      </Text>

      <Text style={styles.subtitle}>
        Share your journey with other USM students.
      </Text>

      <Text style={styles.label}>
        Select Vehicle
      </Text>

      {vehicles.map((vehicle) => (
        <TouchableOpacity
          key={vehicle.id}
          onPress={() =>
            setSelectedVehicle(vehicle)
          }
          style={[
            styles.vehicleCard,

            selectedVehicle?.id ===
              vehicle.id &&
              styles.selectedVehicle,
          ]}
        >
          <Text style={styles.vehicleName}>
            {vehicle.brand} {vehicle.model}
          </Text>

          <Text style={styles.vehicleInfo}>
            {vehicle.colour}
          </Text>

          <Text style={styles.vehicleInfo}>
            {vehicle.plate_number}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>
        From
      </Text>

      <TextInput
        placeholder="Choose pickup location"
        value={origin}
        onChangeText={setOrigin}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/location-picker',
            params: {
              type: 'origin',
            },
          })
        }
        style={styles.mapPickerButton}
      >
        <Text style={styles.mapPickerText}>
          Pick Origin on Map
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>
        To
      </Text>

      <TextInput
        placeholder="Choose destination"
        value={destination}
        onChangeText={setDestination}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/location-picker',
            params: {
              type: 'destination',
            },
          })
        }
        style={styles.mapPickerButton}
      >
        <Text style={styles.mapPickerText}>
          Pick Destination on Map
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>
        Date
      </Text>

      <TextInput
        placeholder="2026-09-27"
        value={date}
        onChangeText={setDate}
        style={styles.input}
      />

      <Text style={styles.label}>
        Departure Time
      </Text>

      <TextInput
        placeholder="17:00"
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      <Text style={styles.label}>
        Available Seats
      </Text>

      <TextInput
        placeholder="3"
        value={seats}
        onChangeText={setSeats}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text style={styles.label}>
        Price Per Seat (RM)
      </Text>

      <TextInput
        placeholder="5"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={styles.label}>
        Notes
      </Text>

      <TextInput
        placeholder="Optional notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={[
          styles.input,
          styles.notes,
        ]}
      />

      <TouchableOpacity
        onPress={createRide}
        disabled={submitting}
        style={[
          styles.button,
          submitting && {
            opacity: 0.5,
          },
        ]}
      >
        <Text style={styles.buttonText}>
          {submitting
            ? 'Publishing...'
            : 'Publish Ride'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#666',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#666',
    marginTop: 8,
    marginBottom: 30,
  },

  label: {
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
  },

  notes: {
    height: 100,
    textAlignVertical: 'top',
  },

  vehicleCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },

  selectedVehicle: {
    borderWidth: 2,
    borderColor: '#222',
  },

  vehicleName: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  vehicleInfo: {
    color: '#666',
    marginTop: 4,
  },

  mapPickerButton: {
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    borderRadius: 10,
    marginBottom: 18,
  },

  mapPickerText: {
    textAlign: 'center',
    fontWeight: '600',
  },

  button: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 17,
  },

  noVehicleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  noVehicleText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
});