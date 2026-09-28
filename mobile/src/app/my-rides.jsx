import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import {
  supabase,
} from '../lib/supabase';

export default function MyRidesScreen() {
  const [driverRides, setDriverRides] =
    useState([]);

  const [passengerRides, setPassengerRides] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [activeTab, setActiveTab] =
    useState('upcoming');

  useFocusEffect(
    useCallback(() => {
      loadMyRides();
    }, [])
  );

  async function loadMyRides() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        console.log(
          'GET USER ERROR:',
          userError.message
        );
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      // Driver rides
      const {
        data: ownedRides,
        error: driverError,
      } = await supabase
        .from('rides')
        .select(`
          id,
          driver_id,
          vehicle_id,
          origin,
          destination,
          departure_date,
          departure_time,
          available_seats,
          price_per_seat,
          notes,
          status,
          created_at,

          vehicles (
            brand,
            model,
            colour,
            plate_number
          )
        `)
        .eq(
          'driver_id',
          user.id
        )
        .order(
          'departure_date',
          {
            ascending: true,
          }
        )
        .order(
          'departure_time',
          {
            ascending: true,
          }
        );

      if (driverError) {
        Alert.alert(
          'Driver rides error',
          driverError.message
        );
      }

      // Passenger rides
      const {
        data: requestedRides,
        error: passengerError,
      } = await supabase
        .from('ride_requests')
        .select(`
          id,
          status,
          seats_requested,
          created_at,

          rides (
            id,
            origin,
            destination,
            departure_date,
            departure_time,
            price_per_seat,
            available_seats,
            status,

            vehicles (
              brand,
              model,
              colour,
              plate_number
            )
          )
        `)
        .eq(
          'passenger_id',
          user.id
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

      if (passengerError) {
        Alert.alert(
          'Passenger rides error',
          passengerError.message
        );
      }

      setDriverRides(
        ownedRides || []
      );

      setPassengerRides(
        requestedRides || []
      );
    } catch (error) {
      console.log(
        'MY RIDES ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to load your rides.'
      );
    } finally {
      setLoading(false);
    }
  }

  const allRideItems =
    useMemo(() => {
      const driverItems =
        driverRides.map(
          (ride) => ({
            key:
              `driver-${ride.id}`,

            role:
              'driver',

            ride,

            requestStatus:
              null,

            seatsRequested:
              null,
          })
        );

      const passengerItems =
        passengerRides
          .filter(
            (request) =>
              request.rides
          )
          .map(
            (request) => ({
              key:
                `passenger-${request.id}`,

              role:
                'passenger',

              ride:
                request.rides,

              requestStatus:
                request.status,

              seatsRequested:
                request.seats_requested,
            })
          );

      return [
        ...driverItems,
        ...passengerItems,
      ];
    }, [
      driverRides,
      passengerRides,
    ]);

  const filteredRides =
    useMemo(() => {
      return allRideItems.filter(
        (item) => {
          const rideStatus =
            item.ride?.status;

          if (
            activeTab ===
            'upcoming'
          ) {
            if (
              item.role ===
              'passenger' &&
              item.requestStatus ===
                'rejected'
            ) {
              return false;
            }

            return (
              rideStatus ===
                'available' ||
              rideStatus ===
                'full'
            );
          }

          if (
            activeTab ===
            'in_progress'
          ) {
            return (
              rideStatus ===
              'in_progress'
            );
          }

          if (
            activeTab ===
            'history'
          ) {
            return (
              rideStatus ===
                'completed' ||
              rideStatus ===
                'cancelled' ||
              (
                item.role ===
                  'passenger' &&
                item.requestStatus ===
                  'rejected'
              )
            );
          }

          return true;
        }
      );
    }, [
      allRideItems,
      activeTab,
    ]);

  function openRide(item) {
    router.push({
      pathname:
        '/ride/[id]',

      params: {
        id:
          item.ride.id,
      },
    });
  }

  function getRoleLabel(
    item
  ) {
    if (
      item.role ===
      'driver'
    ) {
      return 'DRIVER';
    }

    if (
      item.requestStatus ===
      'pending'
    ) {
      return 'PASSENGER • PENDING';
    }

    if (
      item.requestStatus ===
      'accepted'
    ) {
      return 'PASSENGER • ACCEPTED';
    }

    if (
      item.requestStatus ===
      'rejected'
    ) {
      return 'PASSENGER • REJECTED';
    }

    return 'PASSENGER';
  }

  function getRideStatusLabel(
    ride
  ) {
    if (
      ride.status ===
      'in_progress'
    ) {
      return 'IN PROGRESS';
    }

    return ride.status
      ?.replace(
        '_',
        ' '
      )
      .toUpperCase();
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
          Loading your rides...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={
        styles.container
      }

      contentContainerStyle={
        styles.content
      }
    >
      <Text
        style={
          styles.title
        }
      >
        My Rides
      </Text>

      {/* Tabs */}

      <View
        style={
          styles.tabs
        }
      >
        <TouchableOpacity
          onPress={() =>
            setActiveTab(
              'upcoming'
            )
          }

          style={[
            styles.tab,

            activeTab ===
              'upcoming' &&
              styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,

              activeTab ===
                'upcoming' &&
                styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setActiveTab(
              'in_progress'
            )
          }

          style={[
            styles.tab,

            activeTab ===
              'in_progress' &&
              styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,

              activeTab ===
                'in_progress' &&
                styles.activeTabText,
            ]}
          >
            In Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setActiveTab(
              'history'
            )
          }

          style={[
            styles.tab,

            activeTab ===
              'history' &&
              styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,

              activeTab ===
                'history' &&
                styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}

      {filteredRides.length ===
      0 ? (
        <View
          style={
            styles.emptyBox
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            No rides here
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {activeTab ===
            'upcoming'
              ? 'You currently have no upcoming rides.'
              : activeTab ===
                'in_progress'
              ? 'You do not have a ride in progress.'
              : 'You do not have any ride history yet.'}
          </Text>

          {activeTab ===
            'upcoming' && (
            <View
              style={
                styles.emptyActions
              }
            >
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    '/find-ride'
                  )
                }

                style={
                  styles.secondaryButton
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Find a Ride
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push(
                    '/create-ride'
                  )
                }

                style={
                  styles.primaryButton
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Offer a Ride
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        filteredRides.map(
          (item) => {
            const ride =
              item.ride;

            return (
              <TouchableOpacity
                key={
                  item.key
                }

                onPress={() =>
                  openRide(
                    item
                  )
                }

                style={
                  styles.card
                }
              >
                <View
                  style={
                    styles.cardTop
                  }
                >
                  <View
                    style={[
                      styles.roleBadge,

                      item.role ===
                      'driver'
                        ? styles.driverBadge
                        : styles.passengerBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,

                        item.role ===
                          'driver'
                          ? styles.driverBadgeText
                          : styles.passengerBadgeText,
                      ]}
                    >
                      {getRoleLabel(
                        item
                      )}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.rideStatus
                    }
                  >
                    {getRideStatusLabel(
                      ride
                    )}
                  </Text>
                </View>

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
                    styles.route
                  }
                >
                  {
                    ride.destination
                  }
                </Text>

                <View
                  style={
                    styles.divider
                  }
                />

                <View
                  style={
                    styles.infoRow
                  }
                >
                  <View
                    style={
                      styles.infoColumn
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
                      styles.infoColumn
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

                {item.role ===
                'driver' ? (
                  <>
                    <Text
                      style={
                        styles.info
                      }
                    >
                      Vehicle:{' '}
                      {
                        ride.vehicles
                          ?.brand
                      }{' '}
                      {
                        ride.vehicles
                          ?.model
                      }
                    </Text>

                    <Text
                      style={
                        styles.info
                      }
                    >
                      Seats left:{' '}
                      {
                        ride.available_seats
                      }
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={
                        styles.info
                      }
                    >
                      Seats requested:{' '}
                      {
                        item.seatsRequested
                      }
                    </Text>

                    <Text
                      style={
                        styles.info
                      }
                    >
                      Request status:{' '}
                      {item.requestStatus
                        ?.toUpperCase()}
                    </Text>
                  </>
                )}

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
                    styles.openDetails
                  }
                >
                  View Ride Details →
                </Text>
              </TouchableOpacity>
            );
          }
        )
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        'white',
    },

    content: {
      padding: 24,
      paddingTop: 50,
      paddingBottom: 60,
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
      marginBottom: 24,
    },

    tabs: {
      flexDirection:
        'row',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
    },

    tab: {
      flex: 1,
      paddingVertical: 11,
      alignItems:
        'center',
      borderRadius: 9,
    },

    activeTab: {
      backgroundColor:
        '#222',
    },

    tabText: {
      color: '#666',
      fontWeight: '600',
      fontSize: 13,
    },

    activeTabText: {
      color: 'white',
    },

    card: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 16,
      padding: 18,
      marginBottom: 18,
    },

    cardTop: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 14,
      gap: 10,
    },

    roleBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },

    driverBadge: {
      backgroundColor:
        '#222',
    },

    passengerBadge: {
      borderWidth: 1,
      borderColor: '#222',
    },

    roleBadgeText: {
      fontSize: 10,
      fontWeight:
        'bold',
    },

    driverBadgeText: {
      color: 'white',
    },

    passengerBadgeText: {
      color: '#222',
    },

    rideStatus: {
      fontSize: 11,
      fontWeight:
        'bold',
      color: '#666',
    },

    route: {
      fontSize: 18,
      fontWeight:
        'bold',
    },

    arrow: {
      fontSize: 18,
      marginVertical: 5,
    },

    divider: {
      height: 1,
      backgroundColor:
        '#eee',
      marginVertical: 14,
    },

    infoRow: {
      flexDirection:
        'row',
      gap: 12,
      marginBottom: 10,
    },

    infoColumn: {
      flex: 1,
    },

    infoLabel: {
      color: '#777',
      fontSize: 12,
    },

    infoValue: {
      fontWeight: '600',
      marginTop: 3,
    },

    info: {
      color: '#666',
      marginTop: 5,
    },

    price: {
      fontSize: 18,
      fontWeight:
        'bold',
      marginTop: 12,
    },

    openDetails: {
      marginTop: 14,
      fontWeight: '600',
    },

    emptyBox: {
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 14,
      padding: 22,
    },

    emptyTitle: {
      fontSize: 19,
      fontWeight:
        'bold',
    },

    emptyText: {
      color: '#666',
      marginTop: 6,
      lineHeight: 20,
    },

    emptyActions: {
      marginTop: 18,
      gap: 10,
    },

    primaryButton: {
      backgroundColor:
        '#222',
      padding: 14,
      borderRadius: 10,
    },

    primaryButtonText: {
      color: 'white',
      textAlign:
        'center',
      fontWeight:
        'bold',
    },

    secondaryButton: {
      borderWidth: 1,
      borderColor: '#222',
      padding: 14,
      borderRadius: 10,
    },

    secondaryButtonText: {
      textAlign:
        'center',
      fontWeight:
        'bold',
    },
  });