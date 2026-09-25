import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 20,
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: 'bold',
        }}
      >
        USM Carpool
      </Text>

      <Text
        style={{
          fontSize: 16,
          textAlign: 'center',
        }}
      >
        Share rides with fellow USM students
      </Text>

      <TouchableOpacity
        onPress={() => {
          console.log('Register pressed');
          router.push('/register');
        }}
        style={{
          backgroundColor: '#222',
          padding: 16,
          borderRadius: 10,
          width: '100%',
        }}
      >
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Register
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          console.log('Login pressed');
          router.push('/login');
        }}
        style={{
          borderWidth: 1,
          borderColor: '#222',
          padding: 16,
          borderRadius: 10,
          width: '100%',
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}