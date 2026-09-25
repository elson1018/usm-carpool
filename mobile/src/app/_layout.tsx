// Root navigation layout: defines the stack navigator and screen headers for the app
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Landing / Welcome Screen */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* Authentication */}
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

      {/* Main App Screens */}
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />

      {/* Vehicle Management */}
      <Stack.Screen
        name="vehicle"
        options={{
          title: 'Vehicle',
        }}
      />

      <Stack.Screen
        name="my-vehicles"
        options={{
          title: 'My Vehicles',
        }}
      />

      {/* Ride Features */}
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

      <Stack.Screen
        name="my-rides"
        options={{
          title: 'My Rides',
        }}
      />

      <Stack.Screen
        name="ride/[id]"
        options={{
          title: 'Ride Details',
        }}
      />

      <Stack.Screen
        name="ride-requests/[rideId]"
        options={{
          title: 'Passenger Requests',
        }}
      />
    </Stack>
  );
}