import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function register() {
    if (!fullName || !studentId || !faculty || !email || !password) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      Alert.alert('Registration failed', error.message);
      return;
    }

    if (!data.user) {
      Alert.alert('Registration failed', 'Unable to create user.');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: fullName,
        student_id: studentId,
        faculty,
      });

    if (profileError) {
      Alert.alert('Profile creation failed', profileError.message);
      return;
    }

    Alert.alert('Success', 'Your account has been created.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

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

      <TouchableOpacity onPress={register} style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
};