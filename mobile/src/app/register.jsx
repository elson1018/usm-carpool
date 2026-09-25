import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function register() {
    if (
      !fullName ||
      !studentId ||
      !faculty ||
      !email ||
      !password
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in all fields.'
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Invalid password',
        'Password must contain at least 6 characters.'
      );

      return;
    }

    try {
      setLoading(true);

      const normalizedEmail =
        email.trim().toLowerCase();

      const { data, error } =
        await supabase.auth.signUp({
          email: normalizedEmail,

          password: password,

          options: {
            data: {
              full_name: fullName.trim(),
              student_id: studentId.trim(),
              faculty: faculty.trim(),
            },
          },
        });

      if (error) {
        Alert.alert(
          'Registration failed',
          error.message
        );

        return;
      }

      console.log(
        'Registered user:',
        data.user
      );

      Alert.alert(
        'Account created',
        'Registration successful.',
        [
          {
            text: 'Continue',

            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Create Account
      </Text>

      <Text style={styles.subtitle}>
        Join the USM student carpool community
      </Text>

      <TextInput
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

      <TextInput
        placeholder="Student ID"
        value={studentId}
        onChangeText={setStudentId}
        style={styles.input}
      />

      <TextInput
        placeholder="Faculty"
        value={faculty}
        onChangeText={setFaculty}
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        onPress={register}
        disabled={loading}
        style={[
          styles.button,

          loading && {
            opacity: 0.5,
          },
        ]}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Creating account...'
            : 'Register'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/login')
        }
      >
        <Text style={styles.loginText}>
          Already have an account? Login
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
    fontSize: 32,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 30,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 12,
    marginTop: 5,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
  },

  loginText: {
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
});