// Ride Requests screen: allows drivers to review,
// accept, or reject passenger seat requests for their ride

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

import MapView, {
  Marker,
} from 'react-native-maps';

import { supabase } from '../../lib/supabase';

export default function RideRequestsScreen() {
  const { rideId } = useLocalSearchParams();

  const [ride, setRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasMapCoordinates =
    ride?.origin_latitude != null &&
    ride?.origin_longitude != null &&
    ride?.destination_latitude != null &&
    ride?.destination_longitude != null;

  const originCoordinate = hasMapCoordinates
    ? {
        latitude: Number(ride.origin_latitude),
        longitude: Number(ride.origin_longitude),
      }
    : null;

  const destinationCoordinate = hasMapCoordinates
    ? {
        latitude: Number(ride.destination_latitude),
        longitude: Number(ride.destination_longitude),
      }
    : null;

  useEffect(() => {
    loadRequests();
  }, [rideId]);

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

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}

        ListHeaderComponent={
          ride ? (
            <View style={styles.rideCard}>
              <Text style={styles.routeTitle}>
                Ride Route
              </Text>

              <Text style={styles.routeLabel}>
                From
              </Text>

              <Text style={styles.routeValue}>
                {ride.origin}
              </Text>

              <Text style={styles.routeLabel}>
                To
              </Text>

              <Text style={styles.routeValue}>
                {ride.destination}
              </Text>

              <View style={styles.rideInfoRow}>
                <View style={styles.rideInfoBox}>
                  <Text style={styles.infoLabel}>
                    Date
                  </Text>

                  <Text style={styles.infoValue}>
                    {ride.departure_date}
                  </Text>
                </View>

                <View style={styles.rideInfoBox}>
                  <Text style={styles.infoLabel}>
                    Time
                  </Text>

                  <Text style={styles.infoValue}>
                    {ride.departure_time}
                  </Text>
                </View>
              </View>

              <View style={styles.rideInfoRow}>
                <View style={styles.rideInfoBox}>
                  <Text style={styles.infoLabel}>
                    Available Seats
                  </Text>

                  <Text style={styles.infoValue}>
                    {ride.available_seats}
                  </Text>
                </View>

                <View style={styles.rideInfoBox}>
                  <Text style={styles.infoLabel}>
                    Status
                  </Text>

                  <Text style={styles.infoValue}>
                    {ride.status?.toUpperCase()}
                  </Text>
                </View>
              </View>

              {hasMapCoordinates ? (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude:
                      (originCoordinate.latitude +
                        destinationCoordinate.latitude) /
                      2,

                    longitude:
                      (originCoordinate.longitude +
                        destinationCoordinate.longitude) /
                      2,

                    latitudeDelta: Math.max(
                      Math.abs(
                        originCoordinate.latitude -
                          destinationCoordinate.latitude
                      ) * 2,
                      0.03
                    ),

                    longitudeDelta: Math.max(
                      Math.abs(
                        originCoordinate.longitude -
                          destinationCoordinate.longitude
                      ) * 2,
                      0.03
                    ),
                  }}
                >
                  <Marker
                    coordinate={originCoordinate}
                    title="Pickup"
                    description={ride.origin}
                  />

                  <Marker
                    coordinate={destinationCoordinate}
                    title="Destination"
                    description={ride.destination}
                  />
                </MapView>
              ) : (
                <View style={styles.noMapBox}>
                  <Text style={styles.noMapText}>
                    Map location is not available for this ride.
                  </Text>
                </View>
              )}

              <Text style={styles.requestHeading}>
                Requests
              </Text>
            </View>
          ) : null
        }

        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No requests yet
            </Text>

            <Text style={styles.emptyText}>
              Passenger requests will appear here.
            </Text>
          </View>
        }

        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.label}>
              Passenger
            </Text>

            <Text style={styles.passengerName}>
              {item.profiles?.full_name ||
                'USM Student'}
            </Text>

            <Text style={styles.info}>
              Student ID:{' '}
              {item.profiles?.student_id || '-'}
            </Text>

            <Text style={styles.info}>
              Faculty:{' '}
              {item.profiles?.faculty || '-'}
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

            {item.status === 'pending' && (
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
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    backgroundColor: 'white',
  },

  listContent: {
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  rideCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },

  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  routeLabel: {
    color: '#666',
    marginTop: 8,
  },

  routeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 3,
  },

  rideInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },

  rideInfoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
  },

  infoLabel: {
    color: '#666',
    fontSize: 13,
  },

  infoValue: {
    fontWeight: '600',
    marginTop: 4,
  },

  map: {
    width: '100%',
    height: 230,
    borderRadius: 12,
    marginTop: 18,
  },

  noMapBox: {
    marginTop: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
  },

  noMapText: {
    color: '#666',
    textAlign: 'center',
  },

  requestHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 22,
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

  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
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

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});