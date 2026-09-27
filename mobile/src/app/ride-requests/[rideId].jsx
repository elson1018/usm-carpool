// Ride Requests screen:
// Driver can review passenger requests
// and view the actual driving route.

import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
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

export default function RideRequestsScreen() {
  const { rideId } =
    useLocalSearchParams();

  const [ride, setRide] =
    useState(null);

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // Route information
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

  // Load ride + requests
  useEffect(() => {
    loadRequests();
  }, [rideId]);

  // Load road route after
  // ride coordinates are available
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

  async function loadRequests() {
    setLoading(true);

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const {
      data: rideData,
      error: rideError,
    } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError) {
      Alert.alert(
        'Error',
        rideError.message
      );

      setLoading(false);
      return;
    }

    // Make sure current user
    // owns this ride
    if (
      rideData.driver_id !==
      user.id
    ) {
      Alert.alert(
        'Not allowed',
        'You are not the driver of this ride.'
      );

      router.back();
      return;
    }

    setRide(rideData);

    const {
      data,
      error,
    } = await supabase
      .from('ride_requests')
      .select(`
        *,
        profiles (
          full_name,
          student_id,
          faculty,
          average_rating
        )
      `)
      .eq(
        'ride_id',
        rideId
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      Alert.alert(
        'Error',
        error.message
      );

      setRequests([]);
    } else {
      setRequests(
        data || []
      );
    }

    setLoading(false);
  }

  // Load actual driving route
  // using OpenRouteService
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
      console.log(
        'OpenRouteService API key missing'
      );

      setRouteError(
        'Route API key is missing.'
      );

      return;
    }

    setRouteLoading(true);
    setRouteError('');

    try {
      /*
        IMPORTANT:
        ORS coordinates use:

        [longitude, latitude]

        NOT:

        [latitude, longitude]
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
          'ORS HTTP ERROR:',
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
          'ORS JSON error:',
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
        console.log(
          'No route returned:',
          data
        );

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
        ORS gives:
        [longitude, latitude]

        react-native-maps needs:
        {
          latitude,
          longitude
        }
      */

      const convertedCoordinates =
        geoCoordinates.map(
          (
            coordinate
          ) => ({
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
        // metres → kilometres
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

        // seconds → minutes
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

  async function acceptRequest(
    request
  ) {
    if (!ride) return;

    if (
      ride.available_seats <
      request.seats_requested
    ) {
      Alert.alert(
        'Not enough seats',
        'There are not enough available seats.'
      );

      return;
    }

    const remainingSeats =
      ride.available_seats -
      request.seats_requested;

    const {
      error:
        requestError,
    } = await supabase
      .from('ride_requests')
      .update({
        status:
          'accepted',
      })
      .eq(
        'id',
        request.id
      );

    if (requestError) {
      Alert.alert(
        'Error',
        requestError.message
      );

      return;
    }

    const {
      error:
        rideUpdateError,
    } = await supabase
      .from('rides')
      .update({
        available_seats:
          remainingSeats,

        status:
          remainingSeats ===
          0
            ? 'full'
            : 'available',
      })
      .eq(
        'id',
        rideId
      );

    if (
      rideUpdateError
    ) {
      Alert.alert(
        'Error',
        rideUpdateError.message
      );

      return;
    }

    Alert.alert(
      'Accepted',
      'Passenger request accepted.'
    );

    loadRequests();
  }

  async function rejectRequest(
    request
  ) {
    const {
      error,
    } = await supabase
      .from('ride_requests')
      .update({
        status:
          'rejected',
      })
      .eq(
        'id',
        request.id
      );

    if (error) {
      Alert.alert(
        'Error',
        error.message
      );

      return;
    }

    Alert.alert(
      'Rejected',
      'Passenger request rejected.'
    );

    loadRequests();
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

  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={
          styles.title
        }
      >
        Passenger Requests
      </Text>

      <FlatList
        data={requests}

        keyExtractor={(
          item
        ) => item.id}

        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.listContent
        }

        ListHeaderComponent={
          ride ? (
            <View
              style={
                styles.rideCard
              }
            >
              <Text
                style={
                  styles.routeTitle
                }
              >
                Ride Route
              </Text>

              {/* ORIGIN */}

              <Text
                style={
                  styles.routeLabel
                }
              >
                From
              </Text>

              <Text
                style={
                  styles.routeValue
                }
              >
                {ride.origin}
              </Text>

              {/* DESTINATION */}

              <Text
                style={
                  styles.routeLabel
                }
              >
                To
              </Text>

              <Text
                style={
                  styles.routeValue
                }
              >
                {
                  ride.destination
                }
              </Text>

              {/* DATE + TIME */}

              <View
                style={
                  styles.rideInfoRow
                }
              >
                <View
                  style={
                    styles.rideInfoBox
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Date
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {
                      ride.departure_date
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.rideInfoBox
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Time
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {
                      ride.departure_time
                    }
                  </Text>
                </View>
              </View>

              {/* SEATS + STATUS */}

              <View
                style={
                  styles.rideInfoRow
                }
              >
                <View
                  style={
                    styles.rideInfoBox
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Available Seats
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {
                      ride.available_seats
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.rideInfoBox
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Status
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {ride.status
                      ?.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* MAP */}

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
                    {/* PICKUP */}

                    <Marker
                      coordinate={
                        originCoordinate
                      }

                      title="Pickup"

                      description={
                        ride.origin
                      }
                    />

                    {/* DESTINATION */}

                    <Marker
                      coordinate={
                        destinationCoordinate
                      }

                      title="Destination"

                      description={
                        ride.destination
                      }
                    />

                    {/* ACTUAL ROAD ROUTE */}

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

                  {/* ROUTE LOADING */}

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
                        driving
                        route...
                      </Text>
                    </View>
                  )}

                  {/* DISTANCE + TIME */}

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

                  {/* ROUTE ERROR */}

                  {routeError ? (
                    <Text
                      style={
                        styles.routeError
                      }
                    >
                      {
                        routeError
                      }
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

              <Text
                style={
                  styles.requestHeading
                }
              >
                Requests
              </Text>
            </View>
          ) : null
        }

        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              No requests yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Passenger requests
              will appear here.
            </Text>
          </View>
        }

        renderItem={({
          item,
        }) => (
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
              Passenger
            </Text>

            <Text
              style={
                styles.passengerName
              }
            >
              {item.profiles
                ?.full_name ||
                'USM Student'}
            </Text>

            <Text
              style={
                styles.info
              }
            >
              Student ID:{' '}
              {item.profiles
                ?.student_id ||
                '-'}
            </Text>

            <Text
              style={
                styles.info
              }
            >
              Faculty:{' '}
              {item.profiles
                ?.faculty ||
                '-'}
            </Text>

            <Text
              style={
                styles.info
              }
            >
              Rating:{' '}
              {item.profiles
                ?.average_rating ||
                0}
            </Text>

            <Text
              style={
                styles.info
              }
            >
              Seats requested:{' '}
              {
                item.seats_requested
              }
            </Text>

            <Text
              style={
                styles.info
              }
            >
              Status:{' '}
              {item.status.toUpperCase()}
            </Text>

            {item.status ===
              'pending' && (
              <View
                style={
                  styles.actions
                }
              >
                <TouchableOpacity
                  onPress={() =>
                    acceptRequest(
                      item
                    )
                  }

                  style={
                    styles.acceptButton
                  }
                >
                  <Text
                    style={
                      styles.acceptText
                    }
                  >
                    Accept
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    rejectRequest(
                      item
                    )
                  }

                  style={
                    styles.rejectButton
                  }
                >
                  <Text
                    style={
                      styles.rejectText
                    }
                  >
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 50,
      backgroundColor:
        'white',
    },

    listContent: {
      paddingBottom: 40,
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
      fontSize: 30,
      fontWeight:
        'bold',
      marginBottom: 20,
    },

    rideCard: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
    },

    routeTitle: {
      fontSize: 20,
      fontWeight:
        'bold',
      marginBottom: 14,
    },

    routeLabel: {
      color: '#666',
      marginTop: 8,
    },

    routeValue: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 3,
    },

    rideInfoRow: {
      flexDirection:
        'row',
      gap: 10,
      marginTop: 15,
    },

    rideInfoBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 10,
      padding: 12,
    },

    infoLabel: {
      color: '#666',
      fontSize: 13,
    },

    infoValue: {
      fontWeight: '600',
      marginTop: 4,
    },

    map: {
      width: '100%',
      height: 260,
      borderRadius: 12,
      marginTop: 18,
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
      marginTop: 18,
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

    requestHeading: {
      fontSize: 20,
      fontWeight:
        'bold',
      marginTop: 22,
    },

    card: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 14,
      padding: 18,
      marginBottom: 15,
    },

    label: {
      color: '#666',
    },

    passengerName: {
      fontSize: 18,
      fontWeight:
        'bold',
      marginTop: 4,
    },

    info: {
      marginTop: 8,
    },

    actions: {
      flexDirection:
        'row',
      gap: 10,
      marginTop: 18,
    },

    acceptButton: {
      flex: 1,
      backgroundColor:
        '#222',
      padding: 13,
      borderRadius: 10,
    },

    rejectButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#222',
      padding: 13,
      borderRadius: 10,
    },

    acceptText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    rejectText: {
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    emptyContainer: {
      paddingVertical: 40,
      alignItems:
        'center',
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight:
        'bold',
    },

    emptyText: {
      color: '#666',
      marginTop: 8,
      textAlign:
        'center',
    },
  });