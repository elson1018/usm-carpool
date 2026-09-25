// Find Ride screen: displays available carpool rides fetched from Supabase for students to browse and join
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
  useCallback,
  useState,
} from 'react';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import { supabase } from '../lib/supabase';

export default function FindRideScreen() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reload available rides whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRides();
    }, [])
  );

  // Query all available rides and their vehicle details from Supabase
  async function loadRides() {
    setLoading(true);

    const { data, error } = await supabase
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
      .eq('status', 'available')
      .order('departure_date', {
        ascending: true,
      })
      .order('departure_time', {
        ascending: true,
      });

    if (error) {
      console.log(
        'Ride loading error:',
        error.message
      );

      Alert.alert(
        'Error',
        error.message
      );

      setRides([]);
    } else {
      console.log('Rides:', data);

      setRides(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={{ marginTop: 10 }}>
          Loading rides...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Available Rides
      </Text>

      {rides.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            No rides available
          </Text>

          <Text style={styles.emptyText}>
            Check again later or offer a ride.
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push('/create-ride')
            }
            style={styles.offerButton}
          >
            <Text style={styles.buttonText}>
              Offer a Ride
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) =>
            item.id
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>

              <Text style={styles.route}>
                {item.origin}
              </Text>

              <Text style={styles.arrow}>
                ↓
              </Text>

              <Text style={styles.route}>
                {item.destination}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.info}>
                Date: {item.departure_date}
              </Text>

              <Text style={styles.info}>
                Time: {item.departure_time}
              </Text>

              <Text style={styles.info}>
                Available seats:{' '}
                {item.available_seats}
              </Text>

              <Text style={styles.info}>
                Vehicle:{' '}
                {item.vehicles?.brand || ''}
                {' '}
                {item.vehicles?.model || ''}
              </Text>

              {item.vehicles?.colour ? (
                <Text style={styles.info}>
                  {item.vehicles.colour}
                  {' • '}
                  {item.vehicles.plate_number}
                </Text>
              ) : null}

              <Text style={styles.price}>
                RM{item.price_per_seat} / seat
              </Text>

              <TouchableOpacity
                onPress={() => {
                  console.log(
                    'Opening ride:',
                    item.id
                  );

                  router.push({
                    pathname: '/ride/[id]',
                    params: {
                      id: item.id,
                    },
                  });
                }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  View Ride
                </Text>
              </TouchableOpacity>

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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },

  route: {
    fontSize: 19,
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
    fontSize: 15,
    marginBottom: 5,
  },

  price: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 8,
  },

  button: {
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
  },

  offerButton: {
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
  },

  buttonText: {
    color: 'white',
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
});