// Ride Details screen: displays full information about a selected ride and allows passengers to request a seat
import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

import {
  useLocalSearchParams,
  router,
} from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [ride, setRide] = useState(null);
  const [user, setUser] = useState(null);
  const [request, setRequest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  // Fetch ride details whenever the screen loads or route parameter changes
  useEffect(() => {
    loadPage();
  }, [id]);

  // Load ride info with vehicle details and check if user has an existing request
  async function loadPage() {
    setLoading(true);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    setUser(currentUser);

    const { data: rideData, error: rideError } =
      await supabase
        .from('rides')
        .select(`
          *,
          vehicles (
            brand,
            model,
            colour,
            plate_number
          )
        `)
        .eq('id', id)
        .single();

    if (rideError) {
      Alert.alert(
        'Error',
        rideError.message
      );

      setLoading(false);
      return;
    }

    setRide(rideData);

    const { data: existingRequest } =
      await supabase
        .from('ride_requests')
        .select('*')
        .eq('ride_id', id)
        .eq('passenger_id', currentUser.id)
        .maybeSingle();

    setRequest(existingRequest || null);

    setLoading(false);
  }

  // Submit a ride request for the current user to the driver
  async function requestSeat() {
    if (!ride || !user) return;

    if (ride.driver_id === user.id) {
      Alert.alert(
        'Your ride',
        'You cannot request a seat in your own ride.'
      );
      return;
    }

    if (ride.available_seats <= 0) {
      Alert.alert(
        'Ride full',
        'There are no available seats.'
      );
      return;
    }

    setRequesting(true);

    const { data, error } = await supabase
      .from('ride_requests')
      .insert({
        ride_id: ride.id,
        passenger_id: user.id,
        seats_requested: 1,
        status: 'pending',
      })
      .select()
      .single();

    setRequesting(false);

    if (error) {
      Alert.alert(
        'Unable to request ride',
        error.message
      );
      return;
    }

    setRequest(data);

    Alert.alert(
      'Request sent',
      'The driver can now review your request.'
    );
  }

  // Cancel a pending ride request by deleting it from Supabase
  async function cancelRequest() {
    if (!request) return;

    const { error } = await supabase
      .from('ride_requests')
      .delete()
      .eq('id', request.id);

    if (error) {
      Alert.alert(
        'Unable to cancel request',
        error.message
      );
      return;
    }

    setRequest(null);

    Alert.alert(
      'Request cancelled',
      'Your ride request has been cancelled.'
    );
  }

  // Confirm with the driver before cancelling their offered ride
  function confirmCancelRide() {
    Alert.alert(
      'Cancel ride?',
      'This ride will no longer be available to passengers.',
      [
        {
          text: 'Keep Ride',
          style: 'cancel',
        },
        {
          text: 'Cancel Ride',
          style: 'destructive',
          onPress: cancelRide,
        },
      ]
    );
  }

  // Mark the ride as cancelled in Supabase
  async function cancelRide() {
    const { error } = await supabase
      .from('rides')
      .update({
        status: 'cancelled',
      })
      .eq('id', ride.id);

    if (error) {
      Alert.alert(
        'Unable to cancel ride',
        error.message
      );
      return;
    }

    setRide({
      ...ride,
      status: 'cancelled',
    });

    Alert.alert(
      'Ride cancelled',
      'The ride has been cancelled.'
    );
  }

  // Mark the ride as completed in Supabase
  async function completeRide() {
    const { error } = await supabase
      .from('rides')
      .update({
        status: 'completed',
      })
      .eq('id', ride.id);

    if (error) {
      Alert.alert(
        'Unable to complete ride',
        error.message
      );
      return;
    }

    setRide({
      ...ride,
      status: 'completed',
    });

    Alert.alert(
      'Ride completed',
      'This ride has been marked as completed.'
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text>Ride not found.</Text>
      </View>
    );
  }

  // Check whether the current user is the driver of this ride
  const isDriver =
    user?.id === ride.driver_id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Ride Details
      </Text>

      <View style={styles.card}>
        <Text style={styles.route}>
          {ride.origin}
        </Text>

        <Text style={styles.arrow}>↓</Text>

        <Text style={styles.route}>
          {ride.destination}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>
          {ride.departure_date}
        </Text>

        <Text style={styles.label}>Time</Text>
        <Text style={styles.value}>
          {ride.departure_time}
        </Text>

        <Text style={styles.label}>Vehicle</Text>
        <Text style={styles.value}>
          {ride.vehicles?.brand} {ride.vehicles?.model}
        </Text>

        <Text style={styles.secondary}>
          {ride.vehicles?.colour} • {ride.vehicles?.plate_number}
        </Text>

        <Text style={styles.label}>
          Available Seats
        </Text>

        <Text style={styles.value}>
          {ride.available_seats}
        </Text>

        <Text style={styles.label}>Price</Text>

        <Text style={styles.price}>
          RM{ride.price_per_seat} / seat
        </Text>

        <Text style={styles.label}>
          Ride Status
        </Text>

        <Text style={styles.status}>
          {ride.status.toUpperCase()}
        </Text>

        {ride.notes ? (
          <>
            <Text style={styles.label}>
              Notes
            </Text>

            <Text style={styles.value}>
              {ride.notes}
            </Text>
          </>
        ) : null}
      </View>

      {/* Show status if user is the driver or has already requested; otherwise show Request button */}
      {isDriver ? (
        <View>
          <Text style={styles.message}>
            This is your ride.
          </Text>

          {ride.status === 'available' ||
          ride.status === 'full' ? (
            <>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/ride-requests/[rideId]',
                    params: {
                      rideId: ride.id,
                    },
                  })
                }
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  View Passenger Requests
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={completeRide}
                style={styles.completeButton}
              >
                <Text style={styles.completeButtonText}>
                  Mark as Completed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmCancelRide}
                style={styles.cancelRideButton}
              >
                <Text style={styles.cancelRideText}>
                  Cancel Ride
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : request ? (
        <View style={styles.statusBox}>
          <Text style={styles.label}>
            Request Status
          </Text>

          <Text style={styles.status}>
            {request.status.toUpperCase()}
          </Text>

          {request.status === 'pending' ? (
            <TouchableOpacity
              onPress={cancelRequest}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>
                Cancel Request
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          onPress={requestSeat}
          disabled={requesting}
          style={[
            styles.button,
            requesting && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.buttonText}>
            {requesting
              ? 'Sending...'
              : 'Request Seat'}
          </Text>
        </TouchableOpacity>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  route: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  arrow: {
    fontSize: 20,
    marginVertical: 8,
  },

  label: {
    color: '#666',
    marginTop: 14,
    marginBottom: 3,
  },

  value: {
    fontSize: 17,
    fontWeight: '600',
  },

  secondary: {
    color: '#666',
    marginTop: 3,
  },

  price: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  button: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 12,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },

  message: {
    textAlign: 'center',
    fontWeight: '600',
  },

  statusBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 18,
  },

  status: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },

  cancelButton: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#b00020',
    padding: 13,
    borderRadius: 10,
  },

  cancelText: {
    color: '#b00020',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  completeButton: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
  },

  completeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  cancelRideButton: {
    borderWidth: 1,
    borderColor: '#b00020',
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
  },

  cancelRideText: {
    color: '#b00020',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});