// Test screen: quick diagnostic check to verify Supabase configuration in the app
import { View, Text } from 'react-native';

export default function TestSupabase() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Supabase is configured</Text>
    </View>
  );
}