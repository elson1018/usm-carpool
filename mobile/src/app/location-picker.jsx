import { useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import MapView, {
  Marker,
} from 'react-native-maps';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

export default function LocationPickerScreen() {
  const { type } = useLocalSearchParams();

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  function handleMapPress(event) {
    const {
      latitude,
      longitude,
    } = event.nativeEvent.coordinate;

    setSelectedLocation({
      latitude,
      longitude,
    });
  }

  function confirmLocation() {
    if (!selectedLocation) {
      return;
    }

    router.replace({
      pathname: '/create-ride',

      params: {
        type: type,

        latitude:
          selectedLocation.latitude.toString(),

        longitude:
          selectedLocation.longitude.toString(),
      },
    });
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 5.3556,
          longitude: 100.3025,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title={
              type === 'destination'
                ? 'Destination'
                : 'Pickup'
            }
          />
        )}
      </MapView>

      <View style={styles.bottomPanel}>
        <Text style={styles.title}>
          {type === 'destination'
            ? 'Choose Destination'
            : 'Choose Pickup Location'}
        </Text>

        {selectedLocation ? (
          <>
            <Text style={styles.coordinates}>
              Latitude:{' '}
              {selectedLocation.latitude.toFixed(6)}
            </Text>

            <Text style={styles.coordinates}>
              Longitude:{' '}
              {selectedLocation.longitude.toFixed(6)}
            </Text>

            <TouchableOpacity
              onPress={confirmLocation}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                Confirm Location
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.help}>
            Tap anywhere on the map.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  bottomPanel: {
    padding: 20,
    backgroundColor: 'white',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  coordinates: {
    color: '#666',
    marginTop: 3,
  },

  help: {
    color: '#666',
  },

  button: {
    marginTop: 15,
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});