// Ride Requests screen: allows drivers to review, accept, or reject passenger seat requests for their ride
import { useEffect, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  useLocalSearchParams,
  router,
} from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function RideRequestsScreen() {
  const { rideId } = useLocalSearchParams();

  const [ride, setRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load ride details and requests on mount or when rideId changes
  useEffect(() => {
    loadRequests();
  }, [rideId]);

  // Fetch ride info (confirming ownership) and passenger requests with profile data
  async function loadRequests() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const {
      data: rideData,
      error: rideError,
    } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError) {
      Alert.alert(
        'Error',
        rideError.message
      );

      setLoading(false);
      return;
    }

    if (rideData.driver_id !== user.id) {
      Alert.alert(
        'Not allowed',
        'You are not the driver of this ride.'
      );

      router.back();
      return;
    }

    setRide(rideData);

    const {
        data,
        error,
        } = await supabase
        .from('ride_requests')
        .select(`
            *,
            profiles (
            full_name,
            student_id,
            faculty,
            average_rating
            )
        `)
        .eq('ride_id', rideId)
        .order('created_at', {
            ascending: true,
        });

    if (error) {
      Alert.alert(
        'Error',
        error.message
      );

      setRequests([]);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }

  // Accept a passenger request and update available seats on the ride
  async function acceptRequest(request) {
    if (!ride) return;

    if (
      ride.available_seats <
      request.seats_requested
    ) {
      Alert.alert(
        'Not enough seats',
        'There are not enough available seats.'
      );

      return;
    }

    const remainingSeats =
      ride.available_seats -
      request.seats_requested;

    const {
      error: requestError,
    } = await supabase
      .from('ride_requests')
      .update({
        status: 'accepted',
      })
      .eq('id', request.id);

    if (requestError) {
      Alert.alert(
        'Error',
        requestError.message
      );

      return;
    }

    const {
      error: rideError,
    } = await supabase
      .from('rides')
      .update({
        available_seats: remainingSeats,
        status:
          remainingSeats === 0
            ? 'full'
            : 'available',
      })
      .eq('id', rideId);

    if (rideError) {
      Alert.alert(
        'Error',
        rideError.message
      );

      return;
    }

    Alert.alert(
      'Accepted',
      'Passenger request accepted.'
    );

    loadRequests();
  }

  // Reject a passenger request
  async function rejectRequest(request) {
    const { error } = await supabase
      .from('ride_requests')
      .update({
        status: 'rejected',
      })
      .eq('id', request.id);

    if (error) {
      Alert.alert(
        'Error',
        error.message
      );

      return;
    }

    Alert.alert(
      'Rejected',
      'Passenger request rejected.'
    );

    loadRequests();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Passenger Requests
      </Text>

      {requests.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            No requests yet
          </Text>

          <Text style={styles.emptyText}>
            Passenger requests will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) =>
            item.id
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.label}>
  Passenger
</Text>

<Text style={styles.passengerName}>
  {item.profiles?.full_name || 'USM Student'}
</Text>

<Text style={styles.info}>
  Student ID: {item.profiles?.student_id || '-'}
</Text>

<Text style={styles.info}>
  Faculty: {item.profiles?.faculty || '-'}
</Text>

<Text style={styles.info}>
  Rating:{' '}
  {item.profiles?.average_rating || 0}
</Text>

              <Text style={styles.info}>
                Seats requested:{' '}
                {item.seats_requested}
              </Text>

              <Text style={styles.info}>
                Status:{' '}
                {item.status.toUpperCase()}
              </Text>

              {item.status === 'pending' ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() =>
                      acceptRequest(item)
                    }
                    style={styles.acceptButton}
                  >
                    <Text style={styles.acceptText}>
                      Accept
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      rejectRequest(item)
                    }
                    style={styles.rejectButton}
                  >
                    <Text style={styles.rejectText}>
                      Reject
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
  },

  label: {
    color: '#666',
  },

  value: {
    fontWeight: '600',
    marginTop: 4,
  },

  info: {
    marginTop: 8,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  acceptButton: {
    flex: 1,
    backgroundColor: '#222',
    padding: 13,
    borderRadius: 10,
  },

  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#222',
    padding: 13,
    borderRadius: 10,
  },

  acceptText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  rejectText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#666',
    marginTop: 8,
  },

  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
});