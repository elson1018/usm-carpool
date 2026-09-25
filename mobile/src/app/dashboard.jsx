// Dashboard screen: main menu showing user profile and quick access to carpool actions
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

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Load user data on mount and listen for authentication changes
  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          router.replace('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch current session and profile data from Supabase
  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace('/login');
      return;
    }

    const currentUser = session.user;

    setUser(currentUser);

    const { data: profileData, error } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error) {
      console.log(
        'Profile error:',
        error.message
      );
    } else {
      setProfile(profileData);
    }

    setLoading(false);
  }

  // Log out the user and return to the welcome screen
  async function logout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.log(
        'Logout error:',
        error.message
      );

      return;
    }

    router.replace('/');
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Welcome
        {profile?.full_name
          ? `, ${profile.full_name}`
          : ''}
        👋
      </Text>

      <Text style={styles.email}>
        {user?.email}
      </Text>

      <Text style={styles.title}>
        Where are you going?
      </Text>

      <TouchableOpacity
        onPress={() =>
          router.push('/find-ride')
        }
        style={styles.primaryButton}
      >
        <Text style={styles.primaryText}>
          Find a Ride
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/create-ride')
        }
        style={styles.primaryButton}
      >
        <Text style={styles.primaryText}>
          Offer a Ride
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
            router.push('/my-vehicles')
        }
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>
            My Vehicles
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() =>
          router.push('/my-rides')
        }
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>
          My Rides
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
  },

  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    marginBottom: 40,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
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

  logoutButton: {
    marginTop: 40,
    padding: 12,
  },

  logoutText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
});