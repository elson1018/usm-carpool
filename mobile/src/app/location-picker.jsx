import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import MapView, {
  Marker,
} from 'react-native-maps';

import * as Location from 'expo-location';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

export default function LocationPickerScreen() {
  const { type } = useLocalSearchParams();

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  const [placeName, setPlaceName] =
    useState('');

  const [loadingAddress, setLoadingAddress] =
    useState(false);

  const [hasPermission, setHasPermission] =
    useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  async function requestLocationPermission() {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setHasPermission(true);
      } else {
        setHasPermission(false);

        Alert.alert(
          'Location permission needed',
          'Please allow location permission so the app can identify place names.'
        );
      }
    } catch (error) {
      console.log(
        'Permission error:',
        error
      );
    }
  }

  async function handleMapPress(event) {
    const {
      latitude,
      longitude,
    } = event.nativeEvent.coordinate;

    setSelectedLocation({
      latitude,
      longitude,
    });

    setPlaceName('');
    setLoadingAddress(true);

    try {
      if (!hasPermission) {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'Please allow location access first.'
          );

          setLoadingAddress(false);
          return;
        }

        setHasPermission(true);
      }

      const results =
        await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

      console.log(
        'REVERSE GEOCODE RESULT:',
        results
      );

      if (
        results &&
        results.length > 0
      ) {
        const address = results[0];

        console.log(
          'ADDRESS:',
          address
        );

        const addressParts = [
          address.name,
          address.street,
          address.district,
          address.subregion,
          address.city,
          address.region,
          address.country,
        ].filter(
          (item) =>
            item &&
            item.trim() !== ''
        );

        const uniqueAddressParts =
          [...new Set(addressParts)];

        const formattedAddress =
          uniqueAddressParts.join(', ');

        if (formattedAddress) {
          setPlaceName(
            formattedAddress
          );
        } else {
          setPlaceName(
            'Selected Location'
          );
        }
      } else {
        setPlaceName(
          'Selected Location'
        );
      }
    } catch (error) {
      console.log(
        'REVERSE GEOCODING ERROR:',
        error
      );

      Alert.alert(
        'Address unavailable',
        'The map location was selected, but the address could not be identified.'
      );

      setPlaceName(
        'Selected Location'
      );
    } finally {
      setLoadingAddress(false);
    }
  }

  function confirmLocation() {
    if (!selectedLocation) {
      Alert.alert(
        'No location selected',
        'Please select a location on the map.'
      );

      return;
    }

    router.replace({
      pathname: '/create-ride',

      params: {
        type,

        latitude:
          selectedLocation.latitude.toString(),

        longitude:
          selectedLocation.longitude.toString(),

        placeName:
          placeName || 'Selected Location',
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

        showsUserLocation={
          hasPermission
        }
      >
        {selectedLocation && (
          <Marker
            coordinate={
              selectedLocation
            }

            title={
              type === 'destination'
                ? 'Destination'
                : 'Pickup'
            }

            description={
              placeName
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

        {!selectedLocation && (
          <Text style={styles.help}>
            Tap anywhere on the map.
          </Text>
        )}

        {selectedLocation && (
          <>
            {loadingAddress ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />

                <Text style={styles.loadingText}>
                  Finding address...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.locationName}>
                  {placeName ||
                    'Selected Location'}
                </Text>

                <Text style={styles.coordinates}>
                  {selectedLocation.latitude.toFixed(6)}
                  {', '}
                  {selectedLocation.longitude.toFixed(6)}
                </Text>
              </>
            )}

            <TouchableOpacity
              onPress={confirmLocation}

              disabled={
                loadingAddress
              }

              style={[
                styles.button,

                loadingAddress && {
                  opacity: 0.5,
                },
              ]}
            >
              <Text style={styles.buttonText}>
                Confirm Location
              </Text>
            </TouchableOpacity>
          </>
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
    marginBottom: 12,
  },

  help: {
    color: '#666',
  },

  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },

  coordinates: {
    color: '#666',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  loadingText: {
    marginLeft: 10,
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