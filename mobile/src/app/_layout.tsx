import { Stack } from 'expo-router';

import {
  RideDraftProvider,
} from '../context/RideDraftContext';

export default function RootLayout() {
  return (
    <RideDraftProvider>
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
          name="my-vehicles"
          options={{
            title: 'My Vehicles',
          }}
        />

        <Stack.Screen
          name="create-ride"
          options={{
            title: 'Offer Ride',
          }}
        />

        <Stack.Screen
          name="location-picker"
          options={{
            title: 'Choose Location',
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

        <Stack.Screen
          name="verification"
          options={{
            title: 'Verification',
          }}
        />

        <Stack.Screen
          name="admin-verification"
          options={{
            title: 'Admin Verification',
          }}
        />
      </Stack>
    </RideDraftProvider>
  );
}