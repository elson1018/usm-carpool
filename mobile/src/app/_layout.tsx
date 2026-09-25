import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'USM Carpool',
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
    </Stack>
  );
}