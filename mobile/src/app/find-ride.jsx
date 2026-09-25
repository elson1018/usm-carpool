import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';

const rides = [ //sample data, will remove soon
  {
    id: '1',
    driver: 'Jason',
    origin: 'USM',
    destination: 'Queensbay Mall',
    time: '6:00 PM',
    seats: 3,
    price: 4,
  },
  {
    id: '2',
    driver: 'Aiman',
    origin: 'USM',
    destination: 'Bayan Lepas',
    time: '7:30 PM',
    seats: 2,
    price: 5,
  },
];

export default function FindRideScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Available Rides
      </Text>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.route}>
              {item.origin} → {item.destination}
            </Text>

            <Text>
              Driver: {item.driver}
            </Text>

            <Text>
              Departure: {item.time}
            </Text>

            <Text>
              Seats: {item.seats}
            </Text>

            <Text>
              RM{item.price} / seat
            </Text>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>
                View Ride
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
  },

  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    gap: 6,
  },

  route: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  button: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
};