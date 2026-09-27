// Ride Details screen:
// shows ride information, actual road route,
// passenger request actions, and driver controls.

import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

import {
  useLocalSearchParams,
  router,
} from 'expo-router';

import MapView, {
  Marker,
  Polyline,
} from 'react-native-maps';

import {
  supabase,
} from '../../lib/supabase';

export default function RideDetailsScreen() {
  const { id } =
    useLocalSearchParams();

  const [ride, setRide] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [request, setRequest] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    requesting,
    setRequesting,
  ] = useState(false);

  // Route states

  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState([]);

  const [
    routeDistance,
    setRouteDistance,
  ] = useState(null);

  const [
    routeDuration,
    setRouteDuration,
  ] = useState(null);

  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false);

  const [
    routeError,
    setRouteError,
  ] = useState('');

  const hasMapCoordinates =
    ride?.origin_latitude != null &&
    ride?.origin_longitude != null &&
    ride?.destination_latitude != null &&
    ride?.destination_longitude != null;

  const originCoordinate =
    hasMapCoordinates
      ? {
          latitude: Number(
            ride.origin_latitude
          ),

          longitude: Number(
            ride.origin_longitude
          ),
        }
      : null;

  const destinationCoordinate =
    hasMapCoordinates
      ? {
          latitude: Number(
            ride.destination_latitude
          ),

          longitude: Number(
            ride.destination_longitude
          ),
        }
      : null;

  useEffect(() => {
    loadPage();
  }, [id]);

  useEffect(() => {
    if (
      ride?.origin_latitude != null &&
      ride?.origin_longitude != null &&
      ride?.destination_latitude != null &&
      ride?.destination_longitude != null
    ) {
      loadRoute();
    }
  }, [
    ride?.origin_latitude,
    ride?.origin_longitude,
    ride?.destination_latitude,
    ride?.destination_longitude,
  ]);

  async function loadPage() {
    setLoading(true);

    const {
      data: {
        user: currentUser,
      },
    } =
      await supabase.auth.getUser();

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    setUser(currentUser);

    const {
      data: rideData,
      error: rideError,
    } = await supabase
      .from('rides')
      .select(`
        *,
        vehicles (
          brand,
          model,
          colour,
          plate_number
        )
      `)
      .eq('id', id)
      .single();

    if (rideError) {
      Alert.alert(
        'Error',
        rideError.message
      );

      setLoading(false);
      return;
    }

    setRide(rideData);

    const {
      data: existingRequest,
    } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('ride_id', id)
      .eq(
        'passenger_id',
        currentUser.id
      )
      .maybeSingle();

    setRequest(
      existingRequest || null
    );

    setLoading(false);
  }

  // Load actual driving route
  // from OpenRouteService
  async function loadRoute() {
    if (
      !ride ||
      ride.origin_latitude == null ||
      ride.origin_longitude == null ||
      ride.destination_latitude == null ||
      ride.destination_longitude == null
    ) {
      return;
    }

    const apiKey =
      process.env
        .EXPO_PUBLIC_ORS_API_KEY;

    if (!apiKey) {
      setRouteError(
        'Route API key is missing.'
      );

      console.log(
        'ORS API key missing'
      );

      return;
    }

    setRouteLoading(true);
    setRouteError('');

    try {
      /*
        ORS expects:

        [longitude, latitude]
      */

      const requestBody = {
        coordinates: [
          [
            Number(
              ride.origin_longitude
            ),
            Number(
              ride.origin_latitude
            ),
          ],

          [
            Number(
              ride.destination_longitude
            ),
            Number(
              ride.destination_latitude
            ),
          ],
        ],
      };

      const response =
        await fetch(
          'https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson',
          {
            method: 'POST',

            headers: {
              Authorization:
                apiKey,

              'Content-Type':
                'application/json',

              Accept:
                'application/geo+json',
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      const responseText =
        await response.text();

      if (!response.ok) {
        console.log(
          'ORS ERROR:',
          response.status,
          responseText
        );

        setRouteError(
          `Unable to load route (${response.status}).`
        );

        return;
      }

      let data;

      try {
        data =
          JSON.parse(
            responseText
          );
      } catch (error) {
        console.log(
          'ORS JSON ERROR:',
          error
        );

        setRouteError(
          'Invalid route response.'
        );

        return;
      }

      if (
        !data.features ||
        data.features.length === 0
      ) {
        setRouteError(
          'No driving route found.'
        );

        return;
      }

      const route =
        data.features[0];

      const geoCoordinates =
        route.geometry
          ?.coordinates;

      if (
        !geoCoordinates ||
        geoCoordinates.length === 0
      ) {
        setRouteError(
          'Route geometry unavailable.'
        );

        return;
      }

      /*
        ORS:
        [longitude, latitude]

        react-native-maps:
        {
          latitude,
          longitude
        }
      */

      const convertedCoordinates =
        geoCoordinates.map(
          (coordinate) => ({
            latitude:
              coordinate[1],

            longitude:
              coordinate[0],
          })
        );

      setRouteCoordinates(
        convertedCoordinates
      );

      const summary =
        route.properties
          ?.summary;

      if (summary) {
        if (
          summary.distance != null
        ) {
          setRouteDistance(
            (
              summary.distance /
              1000
            ).toFixed(1)
          );
        }

        if (
          summary.duration != null
        ) {
          setRouteDuration(
            Math.round(
              summary.duration /
                60
            )
          );
        }
      }
    } catch (error) {
      console.log(
        'ROUTE ERROR:',
        error
      );

      setRouteError(
        'Unable to load driving route.'
      );
    } finally {
      setRouteLoading(false);
    }
  }

  async function requestSeat() {
    if (
      !ride ||
      !user
    ) {
      return;
    }

    if (
      ride.driver_id ===
      user.id
    ) {
      Alert.alert(
        'Your ride',
        'You cannot request a seat in your own ride.'
      );

      return;
    }

    if (
      ride.available_seats <=
      0
    ) {
      Alert.alert(
        'Ride full',
        'There are no available seats.'
      );

      return;
    }

    if (
      ride.status !==
      'available'
    ) {
      Alert.alert(
        'Ride unavailable',
        'This ride is no longer accepting passengers.'
      );

      return;
    }

    setRequesting(true);

    const {
      data,
      error,
    } = await supabase
      .from('ride_requests')
      .insert({
        ride_id:
          ride.id,

        passenger_id:
          user.id,

        seats_requested:
          1,

        status:
          'pending',
      })
      .select()
      .single();

    setRequesting(false);

    if (error) {
      Alert.alert(
        'Unable to request ride',
        error.message
      );

      return;
    }

    setRequest(data);

    Alert.alert(
      'Request sent',
      'The driver can now review your request.'
    );
  }

  async function cancelRequest() {
    if (!request) return;

    const {
      error,
    } = await supabase
      .from('ride_requests')
      .delete()
      .eq(
        'id',
        request.id
      );

    if (error) {
      Alert.alert(
        'Unable to cancel request',
        error.message
      );

      return;
    }

    setRequest(null);

    Alert.alert(
      'Request cancelled',
      'Your ride request has been cancelled.'
    );
  }

  function confirmCancelRide() {
    Alert.alert(
      'Cancel ride?',
      'This ride will no longer be available to passengers.',
      [
        {
          text:
            'Keep Ride',

          style:
            'cancel',
        },

        {
          text:
            'Cancel Ride',

          style:
            'destructive',

          onPress:
            cancelRide,
        },
      ]
    );
  }

  async function cancelRide() {
    const {
      error,
    } = await supabase
      .from('rides')
      .update({
        status:
          'cancelled',
      })
      .eq(
        'id',
        ride.id
      );

    if (error) {
      Alert.alert(
        'Unable to cancel ride',
        error.message
      );

      return;
    }

    setRide({
      ...ride,
      status:
        'cancelled',
    });

    Alert.alert(
      'Ride cancelled',
      'The ride has been cancelled.'
    );
  }

  async function startRide() {
    const {
      error,
    } = await supabase
      .from('rides')
      .update({
        status:
          'in_progress',
      })
      .eq(
        'id',
        ride.id
      );

    if (error) {
      Alert.alert(
        'Unable to start ride',
        error.message
      );

      return;
    }

    setRide({
      ...ride,
      status:
        'in_progress',
    });

    Alert.alert(
      'Ride started',
      'This ride is now in progress.'
    );
  }

  async function completeRide() {
    const {
      error,
    } = await supabase
      .from('rides')
      .update({
        status:
          'completed',
      })
      .eq(
        'id',
        ride.id
      );

    if (error) {
      Alert.alert(
        'Unable to complete ride',
        error.message
      );

      return;
    }

    setRide({
      ...ride,
      status:
        'completed',
    });

    Alert.alert(
      'Ride completed',
      'The trip has finished.'
    );
  }

  if (loading) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading ride...
        </Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text>
          Ride not found.
        </Text>
      </View>
    );
  }

  const isDriver =
    user?.id ===
    ride.driver_id;

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      <Text
        style={
          styles.title
        }
      >
        Ride Details
      </Text>

      {/* ROUTE NAMES */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.routeLabel
          }
        >
          Pickup
        </Text>

        <Text
          style={
            styles.route
          }
        >
          {ride.origin}
        </Text>

        <Text
          style={
            styles.arrow
          }
        >
          ↓
        </Text>

        <Text
          style={
            styles.routeLabel
          }
        >
          Destination
        </Text>

        <Text
          style={
            styles.route
          }
        >
          {
            ride.destination
          }
        </Text>
      </View>

      {/* MAP */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Route Map
        </Text>

        {hasMapCoordinates ? (
          <>
            <MapView
              style={
                styles.map
              }

              initialRegion={{
                latitude:
                  (
                    originCoordinate
                      .latitude +
                    destinationCoordinate
                      .latitude
                  ) / 2,

                longitude:
                  (
                    originCoordinate
                      .longitude +
                    destinationCoordinate
                      .longitude
                  ) / 2,

                latitudeDelta:
                  Math.max(
                    Math.abs(
                      originCoordinate
                        .latitude -
                        destinationCoordinate
                          .latitude
                    ) * 2,

                    0.03
                  ),

                longitudeDelta:
                  Math.max(
                    Math.abs(
                      originCoordinate
                        .longitude -
                        destinationCoordinate
                          .longitude
                    ) * 2,

                    0.03
                  ),
              }}
            >
              <Marker
                coordinate={
                  originCoordinate
                }

                title="Pickup"

                description={
                  ride.origin
                }
              />

              <Marker
                coordinate={
                  destinationCoordinate
                }

                title="Destination"

                description={
                  ride.destination
                }
              />

              {routeCoordinates.length >
                0 && (
                <Polyline
                  coordinates={
                    routeCoordinates
                  }

                  strokeWidth={
                    5
                  }
                />
              )}
            </MapView>

            {routeLoading && (
              <View
                style={
                  styles.routeLoading
                }
              >
                <ActivityIndicator
                  size="small"
                />

                <Text
                  style={
                    styles.routeLoadingText
                  }
                >
                  Calculating
                  driving route...
                </Text>
              </View>
            )}

            {!routeLoading &&
              routeDistance &&
              routeDuration && (
                <View
                  style={
                    styles.routeSummary
                  }
                >
                  <View
                    style={
                      styles.routeSummaryBox
                    }
                  >
                    <Text
                      style={
                        styles.routeSummaryLabel
                      }
                    >
                      Distance
                    </Text>

                    <Text
                      style={
                        styles.routeSummaryValue
                      }
                    >
                      {
                        routeDistance
                      }{' '}
                      km
                    </Text>
                  </View>

                  <View
                    style={
                      styles.routeSummaryBox
                    }
                  >
                    <Text
                      style={
                        styles.routeSummaryLabel
                      }
                    >
                      Estimated Time
                    </Text>

                    <Text
                      style={
                        styles.routeSummaryValue
                      }
                    >
                      {
                        routeDuration
                      }{' '}
                      min
                    </Text>
                  </View>
                </View>
              )}

            {routeError ? (
              <Text
                style={
                  styles.routeError
                }
              >
                {routeError}
              </Text>
            ) : null}
          </>
        ) : (
          <View
            style={
              styles.noMapBox
            }
          >
            <Text
              style={
                styles.noMapText
              }
            >
              Map location is
              not available for
              this ride.
            </Text>
          </View>
        )}
      </View>

      {/* RIDE INFORMATION */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.label
          }
        >
          Date
        </Text>

        <Text
          style={
            styles.value
          }
        >
          {
            ride.departure_date
          }
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Time
        </Text>

        <Text
          style={
            styles.value
          }
        >
          {
            ride.departure_time
          }
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Vehicle
        </Text>

        <Text
          style={
            styles.value
          }
        >
          {ride.vehicles?.brand}{' '}
          {ride.vehicles?.model}
        </Text>

        <Text
          style={
            styles.secondary
          }
        >
          {
            ride.vehicles
              ?.colour
          }{' '}
          •{' '}
          {
            ride.vehicles
              ?.plate_number
          }
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Available Seats
        </Text>

        <Text
          style={
            styles.value
          }
        >
          {
            ride.available_seats
          }
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Price
        </Text>

        <Text
          style={
            styles.price
          }
        >
          RM
          {
            ride.price_per_seat
          }{' '}
          / seat
        </Text>

        <Text
          style={
            styles.label
          }
        >
          Ride Status
        </Text>

        <Text
          style={
            styles.status
          }
        >
          {ride.status
            .toUpperCase()}
        </Text>

        {ride.notes ? (
          <>
            <Text
              style={
                styles.label
              }
            >
              Notes
            </Text>

            <Text
              style={
                styles.value
              }
            >
              {ride.notes}
            </Text>
          </>
        ) : null}
      </View>

      {/* DRIVER CONTROLS */}

      {isDriver ? (
        <View>
          <Text
            style={
              styles.message
            }
          >
            This is your ride.
          </Text>

          {(ride.status ===
            'available' ||
            ride.status ===
              'full') && (
            <>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname:
                      '/ride-requests/[rideId]',

                    params: {
                      rideId:
                        ride.id,
                    },
                  })
                }

                style={
                  styles.button
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  View Passenger
                  Requests
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  startRide
                }

                style={
                  styles.startButton
                }
              >
                <Text
                  style={
                    styles.startButtonText
                  }
                >
                  Start Ride
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  confirmCancelRide
                }

                style={
                  styles.cancelRideButton
                }
              >
                <Text
                  style={
                    styles.cancelRideText
                  }
                >
                  Cancel Ride
                </Text>
              </TouchableOpacity>
            </>
          )}

          {ride.status ===
            'in_progress' && (
            <TouchableOpacity
              onPress={
                completeRide
              }

              style={
                styles.completeButton
              }
            >
              <Text
                style={
                  styles.completeButtonText
                }
              >
                Complete Ride
              </Text>
            </TouchableOpacity>
          )}

          {ride.status ===
            'completed' && (
            <Text
              style={
                styles.finishedText
              }
            >
              Ride completed
            </Text>
          )}

          {ride.status ===
            'cancelled' && (
            <Text
              style={
                styles.cancelledText
              }
            >
              Ride cancelled
            </Text>
          )}
        </View>
      ) : request ? (
        // PASSENGER ALREADY REQUESTED
        <View
          style={
            styles.statusBox
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Request Status
          </Text>

          <Text
            style={
              styles.status
            }
          >
            {request.status
              .toUpperCase()}
          </Text>

          {request.status ===
            'pending' ? (
            <TouchableOpacity
              onPress={
                cancelRequest
              }

              style={
                styles.cancelButton
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel Request
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : ride.status ===
        'available' ? (
        // PASSENGER CAN REQUEST
        <TouchableOpacity
          onPress={
            requestSeat
          }

          disabled={
            requesting
          }

          style={[
            styles.button,

            requesting && {
              opacity: 0.5,
            },
          ]}
        >
          <Text
            style={
              styles.buttonText
            }
          >
            {requesting
              ? 'Sending...'
              : 'Request Seat'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View
          style={
            styles.unavailableBox
          }
        >
          <Text
            style={
              styles.unavailableText
            }
          >
            This ride is no longer
            accepting passenger
            requests.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      padding: 24,
      paddingTop: 50,
      paddingBottom: 50,
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 10,
      color: '#666',
    },

    title: {
      fontSize: 32,
      fontWeight:
        'bold',
      marginBottom: 25,
    },

    card: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },

    routeLabel: {
      color: '#666',
      marginBottom: 4,
    },

    route: {
      fontSize: 20,
      fontWeight:
        'bold',
    },

    arrow: {
      fontSize: 20,
      marginVertical: 10,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight:
        'bold',
      marginBottom: 12,
    },

    map: {
      width: '100%',
      height: 280,
      borderRadius: 12,
    },

    routeLoading: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 12,
    },

    routeLoadingText: {
      marginLeft: 8,
      color: '#666',
    },

    routeSummary: {
      flexDirection:
        'row',
      gap: 10,
      marginTop: 14,
    },

    routeSummaryBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: 12,
    },

    routeSummaryLabel: {
      color: '#666',
      fontSize: 13,
    },

    routeSummaryValue: {
      marginTop: 4,
      fontSize: 17,
      fontWeight:
        'bold',
    },

    routeError: {
      color: '#b00020',
      marginTop: 10,
    },

    noMapBox: {
      padding: 20,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      alignItems:
        'center',
    },

    noMapText: {
      color: '#666',
      textAlign:
        'center',
    },

    label: {
      color: '#666',
      marginTop: 14,
      marginBottom: 3,
    },

    value: {
      fontSize: 17,
      fontWeight:
        '600',
    },

    secondary: {
      color: '#666',
      marginTop: 3,
    },

    price: {
      fontSize: 22,
      fontWeight:
        'bold',
    },

    status: {
      fontSize: 20,
      fontWeight:
        'bold',
      marginTop: 5,
    },

    button: {
      backgroundColor:
        '#222',
      padding: 17,
      borderRadius: 12,
      marginTop: 12,
    },

    buttonText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
      fontSize: 16,
    },

    message: {
      textAlign:
        'center',
      fontWeight:
        '600',
      marginBottom: 5,
    },

    statusBox: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 14,
      padding: 18,
    },

    cancelButton: {
      marginTop: 15,
      borderWidth: 1,
      borderColor:
        '#b00020',
      padding: 13,
      borderRadius: 10,
    },

    cancelText: {
      color: '#b00020',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    startButton: {
      backgroundColor:
        '#222',
      padding: 15,
      borderRadius: 10,
      marginTop: 12,
    },

    startButtonText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    completeButton: {
      backgroundColor:
        '#222',
      padding: 15,
      borderRadius: 10,
      marginTop: 12,
    },

    completeButtonText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    cancelRideButton: {
      borderWidth: 1,
      borderColor:
        '#b00020',
      padding: 15,
      borderRadius: 10,
      marginTop: 12,
    },

    cancelRideText: {
      color: '#b00020',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    finishedText: {
      marginTop: 20,
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    cancelledText: {
      marginTop: 20,
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    unavailableBox: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      padding: 16,
    },

    unavailableText: {
      color: '#666',
      textAlign:
        'center',
    },
  });