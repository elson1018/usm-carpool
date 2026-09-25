import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>USM Carpool</Text>

      <Text style={styles.subtitle}>
        Share rides with fellow USM students
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/find-ride')}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>
          Find a Ride
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/create-ride')}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>
          Offer a Ride
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/vehicle')}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>
          Add Vehicle
        </Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity
        onPress={() => router.push('/login')}
        style={styles.smallButton}
      >
        <Text style={styles.smallButtonText}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/register')}
        style={styles.smallButton}
      >
        <Text style={styles.smallButtonText}>
          Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },

  primaryButton: {
    backgroundColor: '#222',
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
  },

  primaryButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#222',
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
  },

  secondaryButtonText: {
    color: '#222',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
  },

  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },

  smallButton: {
    paddingVertical: 12,
  },

  smallButtonText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});