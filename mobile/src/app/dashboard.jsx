import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function DashboardScreen() {
  async function logout() {
    await supabase.auth.signOut();

    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        USM Carpool
      </Text>

      <Text style={styles.subtitle}>
        What would you like to do?
      </Text>

      <TouchableOpacity
        onPress={() =>
          router.push('/find-ride')
        }
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          Find a Ride
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/create-ride')
        }
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          Offer a Ride
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/vehicle')
        }
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>
          Add Vehicle
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={logout}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 35,
  },

  button: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 12,
    marginBottom: 15,
  },

  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: '#222',
    padding: 17,
    borderRadius: 12,
  },

  secondaryText: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
  },

  logoutButton: {
    marginTop: 40,
  },

  logoutText: {
    textAlign: 'center',
    color: '#666',
  },
});