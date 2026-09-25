import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="register"
        options={{
          title: 'Register',
        }}
      />

      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
        }}
      />

      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="vehicle"
        options={{
          title: 'Vehicle',
        }}
      />

      <Stack.Screen
        name="create-ride"
        options={{
          title: 'Offer Ride',
        }}
      />

      <Stack.Screen
        name="find-ride"
        options={{
          title: 'Find Ride',
        }}
      />
    </Stack>
  );
}