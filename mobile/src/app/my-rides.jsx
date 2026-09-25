// My Rides screen: displays rides where the user is either the driver or a passenger
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  useCallback,
  useState,
} from 'react';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import { supabase } from '../lib/supabase';

export default function MyRidesScreen() {
  const [driverRides, setDriverRides] = useState([]);
  const [passengerRides, setPassengerRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reload rides whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMyRides();
    }, [])
  );

  // Fetch rides offered by this driver and ride requests made as a passenger
  async function loadMyRides() {
    try {
      setLoading(true);

      // 1. Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log(
          'GET USER ERROR:',
          userError.message
        );
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      console.log(
        'CURRENT USER ID:',
        user.id
      );

      // 2. Load rides where this user is the driver
      const {
        data: ownedRides,
        error: driverError,
      } = await supabase
        .from('rides')
        .select(`
          id,
          driver_id,
          vehicle_id,
          origin,
          destination,
          departure_date,
          departure_time,
          available_seats,
          price_per_seat,
          notes,
          status,
          created_at,
          vehicles (
            brand,
            model,
            colour,
            plate_number
          )
        `)
        .eq('driver_id', user.id)
        .order('departure_date', {
          ascending: true,
        })
        .order('departure_time', {
          ascending: true,
        });

      console.log(
        'DRIVER RIDES:',
        ownedRides
      );

      console.log(
        'DRIVER ERROR:',
        driverError
      );

      if (driverError) {
        Alert.alert(
          'Driver rides error',
          driverError.message
        );
      }

      // 3. Load rides where this user is a passenger
      const {
        data: requestedRides,
        error: passengerError,
      } = await supabase
        .from('ride_requests')
        .select(`
          id,
          status,
          seats_requested,
          created_at,
          rides (
            id,
            origin,
            destination,
            departure_date,
            departure_time,
            price_per_seat,
            available_seats,
            status,
            vehicles (
              brand,
              model,
              colour,
              plate_number
            )
          )
        `)
        .eq('passenger_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      console.log(
        'PASSENGER RIDES:',
        requestedRides
      );

      console.log(
        'PASSENGER ERROR:',
        passengerError
      );

      if (passengerError) {
        Alert.alert(
          'Passenger rides error',
          passengerError.message
        );
      }

      setDriverRides(
        ownedRides || []
      );

      setPassengerRides(
        requestedRides || []
      );
    } catch (error) {
      console.log(
        'MY RIDES ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to load your rides.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading your rides...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        My Rides
      </Text>

      {/* DRIVER SECTION */}

      <Text style={styles.sectionTitle}>
        I'm Driving
      </Text>

      {driverRides.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            No rides offered
          </Text>

          <Text style={styles.emptyText}>
            You have not offered any rides yet.
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push('/create-ride')
            }
            style={styles.offerButton}
          >
            <Text style={styles.offerButtonText}>
              Offer a Ride
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        driverRides.map((ride) => (
          <TouchableOpacity
            key={ride.id}
            onPress={() =>
              router.push({
                pathname: '/ride/[id]',
                params: {
                  id: ride.id,
                },
              })
            }
            style={styles.card}
          >
            <View style={styles.driverBadge}>
              <Text style={styles.driverBadgeText}>
                DRIVER
              </Text>
            </View>

            <Text style={styles.route}>
              {ride.origin}
            </Text>

            <Text style={styles.arrow}>
              ↓
            </Text>

            <Text style={styles.route}>
              {ride.destination}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.info}>
              Date: {ride.departure_date}
            </Text>

            <Text style={styles.info}>
              Time: {ride.departure_time}
            </Text>

            <Text style={styles.info}>
              Vehicle:{' '}
              {ride.vehicles?.brand || '-'}
              {' '}
              {ride.vehicles?.model || ''}
            </Text>

            <Text style={styles.info}>
              Plate:{' '}
              {ride.vehicles?.plate_number || '-'}
            </Text>

            <Text style={styles.info}>
              Seats left:{' '}
              {ride.available_seats}
            </Text>

            <Text style={styles.price}>
              RM{ride.price_per_seat} / seat
            </Text>

            <Text style={styles.status}>
              Status:{' '}
              {ride.status?.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* PASSENGER SECTION */}

      <Text style={styles.sectionTitle}>
        I'm a Passenger
      </Text>

      {passengerRides.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            No ride requests
          </Text>

          <Text style={styles.emptyText}>
            You have not requested any rides yet.
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push('/find-ride')
            }
            style={styles.findButton}
          >
            <Text style={styles.findButtonText}>
              Find a Ride
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        passengerRides.map((request) => {
          const ride = request.rides;

          if (!ride) {
            return null;
          }

          return (
            <TouchableOpacity
              key={request.id}
              onPress={() =>
                router.push({
                  pathname: '/ride/[id]',
                  params: {
                    id: ride.id,
                  },
                })
              }
              style={styles.card}
            >
              <View style={styles.passengerBadge}>
                <Text style={styles.passengerBadgeText}>
                  PASSENGER
                </Text>
              </View>

              <Text style={styles.route}>
                {ride.origin}
              </Text>

              <Text style={styles.arrow}>
                ↓
              </Text>

              <Text style={styles.route}>
                {ride.destination}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.info}>
                Date: {ride.departure_date}
              </Text>

              <Text style={styles.info}>
                Time: {ride.departure_time}
              </Text>

              <Text style={styles.info}>
                Seats requested:{' '}
                {request.seats_requested}
              </Text>

              <Text style={styles.price}>
                RM{ride.price_per_seat} / seat
              </Text>

              <Text style={styles.status}>
                Request:{' '}
                {request.status?.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 60,
  },

  center: {
    flex: 1,
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
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
  },

  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },

  route: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  arrow: {
    fontSize: 18,
    marginVertical: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 14,
  },

  info: {
    color: '#666',
    marginBottom: 5,
  },

  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },

  status: {
    fontWeight: 'bold',
    marginTop: 10,
  },

  driverBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#222',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },

  driverBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  passengerBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },

  passengerBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 20,
    marginBottom: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#666',
    marginTop: 5,
  },

  offerButton: {
    backgroundColor: '#222',
    padding: 13,
    borderRadius: 10,
    marginTop: 15,
  },

  offerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  findButton: {
    borderWidth: 1,
    borderColor: '#222',
    padding: 13,
    borderRadius: 10,
    marginTop: 15,
  },

  findButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});