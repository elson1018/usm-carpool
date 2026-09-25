// My Vehicles screen: displays the logged-in user's registered vehicles and allows deletion
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

export default function MyVehiclesScreen() {
  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // Reload vehicles every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  // Fetch all vehicles belonging to the current logged-in user
  async function loadVehicles() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Unable to load vehicles.'
      );
    } else {
      setVehicles(data);
    }

    setLoading(false);
  }

  // Delete a vehicle record from Supabase
  async function deleteVehicle(id) {
    const { error } =
      await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

    if (error) {
      Alert.alert(
        'Error',
        error.message
      );

      return;
    }

    loadVehicles();
  }

  // Prompt the user for confirmation before deleting
  function confirmDelete(vehicle) {
    Alert.alert(
      'Delete vehicle?',
      `${vehicle.brand} ${vehicle.model}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: () =>
            deleteVehicle(vehicle.id),
        },
      ]
    );
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
        My Vehicles
      </Text>

      <TouchableOpacity
        onPress={() =>
          router.push('/vehicle')
        }
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>
          + Add Vehicle
        </Text>
      </TouchableOpacity>

      {vehicles.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            No vehicles yet
          </Text>

          <Text style={styles.emptyText}>
            Add a vehicle before offering a ride.
          </Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) =>
            item.id
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.vehicleName}>
                {item.brand} {item.model}
              </Text>

              <Text style={styles.info}>
                {item.colour}
              </Text>

              <Text style={styles.plate}>
                {item.plate_number}
              </Text>

              <Text style={styles.info}>
                {item.seat_capacity} passenger seats
              </Text>

              <TouchableOpacity
                onPress={() =>
                  confirmDelete(item)
                }
              >
                <Text style={styles.deleteText}>
                  Delete
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
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  addButton: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },

  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
  },

  vehicleName: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  info: {
    color: '#666',
    marginTop: 5,
  },

  plate: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
  },

  deleteText: {
    marginTop: 15,
    color: '#b00020',
    fontWeight: '600',
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