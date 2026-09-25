import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  // Make the app to remember logged-in users
  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      router.replace('/dashboard');
      return;
    }

    setCheckingSession(false);
  }

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        USM Carpool
      </Text>

      <Text style={styles.subtitle}>
        Share rides with fellow USM students
      </Text>

      <TouchableOpacity
        onPress={() =>
          router.push('/register')
        }
        style={styles.primaryButton}
      >
        <Text style={styles.primaryText}>
          Register
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/login')
        }
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>
          Login
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },

  primaryButton: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 12,
    marginBottom: 15,
  },

  primaryText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
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
});