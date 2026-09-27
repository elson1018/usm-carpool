import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import {
  router,
} from 'expo-router';

import {
  useRideDraft,
} from '../context/RideDraftContext';

import {
  supabase,
} from '../lib/supabase';

export default function CreateRideScreen() {
  const [
    vehicles,
    setVehicles,
  ] = useState([]);

  const [
    selectedVehicle,
    setSelectedVehicle,
  ] = useState(null);

  const {
    origin,
    setOrigin,

    originLatitude,
    originLongitude,

    destination,
    setDestination,

    destinationLatitude,
    destinationLongitude,

    date,
    setDate,

    time,
    setTime,

    clearRideDraft,
  } = useRideDraft();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  const [seats, setSeats] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [notes, setNotes] =
    useState('');

  const [
    loadingVehicles,
    setLoadingVehicles,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTime(d) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function parseDateString(str) {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      const parsed = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
      );
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }

  function parseTimeString(str) {
    if (!str) return new Date();
    const parts = str.split(':');
    if (parts.length >= 2) {
      const d = new Date();
      d.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
      if (!Number.isNaN(d.getTime())) {
        return d;
      }
    }
    return new Date();
  }

  function openDatePicker() {
    setTempDate(parseDateString(date));
    setShowDatePicker(true);
  }

  function openTimePicker() {
    setTempTime(parseTimeString(time));
    setShowTimePicker(true);
  }

  function onAndroidDateChange(event, chosenDate) {
    setShowDatePicker(false);
    if (event.type === 'set' && chosenDate) {
      setDate(formatDate(chosenDate));
    }
  }

  function onAndroidTimeChange(event, chosenTime) {
    setShowTimePicker(false);
    if (event.type === 'set' && chosenTime) {
      setTime(formatTime(chosenTime));
    }
  }

  function onIOSDateChange(event, chosenDate) {
    if (chosenDate) {
      setTempDate(chosenDate);
    }
  }

  function confirmIOSDate() {
    setDate(formatDate(tempDate));
    setShowDatePicker(false);
  }

  function onIOSTimeChange(event, chosenTime) {
    if (chosenTime) {
      setTempTime(chosenTime);
    }
  }

  function confirmIOSTime() {
    setTime(formatTime(tempTime));
    setShowTimePicker(false);
  }

  async function loadVehicles() {
    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      router.replace('/login');
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from('vehicles')
      .select('*')
      .eq(
        'owner_id',
        user.id
      );

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

    setVehicles(
      data || []
    );

    if (
      data &&
      data.length > 0
    ) {
      setSelectedVehicle(
        data[0]
      );
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

    const seatNumber =
      Number(seats);

    const priceNumber =
      Number(price);

    if (
      Number.isNaN(
        seatNumber
      ) ||
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
      selectedVehicle
        .seat_capacity
    ) {
      Alert.alert(
        'Too many seats',
        `This vehicle supports only ${selectedVehicle.seat_capacity} passenger seats.`
      );

      return;
    }

    if (
      Number.isNaN(
        priceNumber
      ) ||
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
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    try {
      setSubmitting(true);

      const {
        data,
        error,
      } = await supabase
        .from('rides')
        .insert({
          driver_id:
            user.id,

          vehicle_id:
            selectedVehicle.id,

          origin:
            origin.trim(),

          origin_latitude:
            originLatitude,

          origin_longitude:
            originLongitude,

          destination:
            destination.trim(),

          destination_latitude:
            destinationLatitude,

          destination_longitude:
            destinationLongitude,

          departure_date:
            date,

          departure_time:
            time,

          available_seats:
            seatNumber,

          price_per_seat:
            priceNumber,

          notes:
            notes.trim(),

          status:
            'available',
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

      const routeText =
        `${origin} → ${destination}`;

      clearRideDraft();

      setDate('');
      setTime('');
      setSeats('');
      setPrice('');
      setNotes('');

      Alert.alert(
        'Ride created',
        routeText,
        [
          {
            text:
              'View Rides',

            onPress: () =>
              router.replace(
                '/find-ride'
              ),
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

  if (
    loadingVehicles
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading vehicles...
        </Text>
      </View>
    );
  }

  if (
    vehicles.length === 0
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.noVehicleTitle
          }
        >
          No vehicle registered
        </Text>

        <Text
          style={
            styles.noVehicleText
          }
        >
          Add a vehicle before
          offering a ride.
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push(
              '/vehicle'
            )
          }
          style={
            styles.button
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Add Vehicle
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={
          styles.title
        }
      >
        Offer a Ride
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Share your journey
        with other USM students.
      </Text>

      <Text
        style={
          styles.label
        }
      >
        Select Vehicle
      </Text>

      {vehicles.map(
        (vehicle) => (
          <TouchableOpacity
            key={
              vehicle.id
            }

            onPress={() =>
              setSelectedVehicle(
                vehicle
              )
            }

            style={[
              styles.vehicleCard,

              selectedVehicle
                ?.id ===
                vehicle.id &&
                styles
                  .selectedVehicle,
            ]}
          >
            <Text
              style={
                styles.vehicleName
              }
            >
              {vehicle.brand}{' '}
              {vehicle.model}
            </Text>

            <Text
              style={
                styles.vehicleInfo
              }
            >
              {vehicle.colour}
            </Text>

            <Text
              style={
                styles.vehicleInfo
              }
            >
              {
                vehicle
                  .plate_number
              }
            </Text>
          </TouchableOpacity>
        )
      )}

      <Text
        style={
          styles.label
        }
      >
        From
      </Text>

      <TextInput
        placeholder="Choose pickup location"
        value={origin}
        onChangeText={
          setOrigin
        }
        editable={false}
        style={
          styles.input
        }
      />

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname:
              '/location-picker',

            params: {
              type:
                'origin',
            },
          })
        }

        style={
          styles
            .mapPickerButton
        }
      >
        <Text
          style={
            styles
              .mapPickerText
          }
        >
          Pick Origin on Map
        </Text>
      </TouchableOpacity>

      <Text
        style={
          styles.label
        }
      >
        To
      </Text>

      <TextInput
        placeholder="Choose destination"
        value={
          destination
        }
        onChangeText={
          setDestination
        }
        editable={false}
        style={
          styles.input
        }
      />

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname:
              '/location-picker',

            params: {
              type:
                'destination',
            },
          })
        }

        style={
          styles
            .mapPickerButton
        }
      >
        <Text
          style={
            styles
              .mapPickerText
          }
        >
          Pick Destination
          on Map
        </Text>
      </TouchableOpacity>

      <Text
        style={
          styles.label
        }
      >
        Date
      </Text>

      <TouchableOpacity
        onPress={openDatePicker}
        style={styles.pickerButton}
      >
        <Text
          style={
            date
              ? styles.pickerValueText
              : styles.pickerPlaceholderText
          }
        >
          {date || 'Select date (YYYY-MM-DD)'}
        </Text>
      </TouchableOpacity>

      <Text
        style={
          styles.label
        }
      >
        Departure Time
      </Text>

      <TouchableOpacity
        onPress={openTimePicker}
        style={styles.pickerButton}
      >
        <Text
          style={
            time
              ? styles.pickerValueText
              : styles.pickerPlaceholderText
          }
        >
          {time || 'Select time (HH:mm)'}
        </Text>
      </TouchableOpacity>

      <Text
        style={
          styles.label
        }
      >
        Available Seats
      </Text>

      <TextInput
        placeholder="3"
        value={seats}
        onChangeText={
          setSeats
        }
        keyboardType="number-pad"
        style={
          styles.input
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Price Per Seat (RM)
      </Text>

      <TextInput
        placeholder="5"
        value={price}
        onChangeText={
          setPrice
        }
        keyboardType="decimal-pad"
        style={
          styles.input
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Notes
      </Text>

      <TextInput
        placeholder="Optional notes"
        value={notes}
        onChangeText={
          setNotes
        }
        multiline
        style={[
          styles.input,
          styles.notes,
        ]}
      />

      <TouchableOpacity
        onPress={
          createRide
        }

        disabled={
          submitting
        }

        style={[
          styles.button,

          submitting && {
            opacity: 0.5,
          },
        ]}
      >
        <Text
          style={
            styles.buttonText
          }
        >
          {submitting
            ? 'Publishing...'
            : 'Publish Ride'}
        </Text>
      </TouchableOpacity>

      {/* Date Picker */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalCancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>
                  Select Date
                </Text>

                <TouchableOpacity
                  onPress={confirmIOSDate}
                >
                  <Text style={styles.modalDoneText}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={onIOSDateChange}
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={parseDateString(date)}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onAndroidDateChange}
          />
        )
      )}

      {/* Time Picker */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.modalCancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>
                  Select Departure Time
                </Text>

                <TouchableOpacity
                  onPress={confirmIOSTime}
                >
                  <Text style={styles.modalDoneText}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  is24Hour={true}
                  onChange={onIOSTimeChange}
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showTimePicker && (
          <DateTimePicker
            value={parseTimeString(time)}
            mode="time"
            display="default"
            is24Hour={true}
            onChange={onAndroidTimeChange}
          />
        )
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      padding: 24,
      paddingTop: 50,
      paddingBottom: 50,
    },

    center: {
      flex: 1,
      padding: 24,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 10,
      color: '#666',
    },

    title: {
      fontSize: 32,
      fontWeight:
        'bold',
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
      backgroundColor:
        '#fafafa',
    },

    notes: {
      height: 100,
      textAlignVertical:
        'top',
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
      fontWeight:
        'bold',
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
      textAlign:
        'center',
      fontWeight: '600',
    },

    button: {
      backgroundColor:
        '#222',
      padding: 17,
      borderRadius: 12,
      marginTop: 10,
      width: '100%',
    },

    buttonText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
      fontSize: 17,
    },

    noVehicleTitle: {
      fontSize: 24,
      fontWeight:
        'bold',
    },

    noVehicleText: {
      color: '#666',
      textAlign:
        'center',
      marginTop: 10,
      marginBottom: 20,
    },

    pickerButton: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 12,
      padding: 15,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fafafa',
    },

    pickerValueText: {
      fontSize: 16,
      color: '#111',
      fontWeight: '500',
    },

    pickerPlaceholderText: {
      fontSize: 16,
      color: '#999',
    },

    pickerContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    iosPicker: {
      height: 216,
      width: 320,
      alignSelf: 'center',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },

    modalContent: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
      alignItems: 'center',
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      width: '100%',
    },

    modalTitle: {
      fontSize: 17,
      fontWeight: 'bold',
    },

    modalCancelText: {
      fontSize: 16,
      color: '#666',
    },

    modalDoneText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#222',
    },
  });