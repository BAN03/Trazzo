import '../../global.css';

import { Stack } from 'expo-router';
import { Providers } from '../providers/Providers';

export default function RootLayout() {
  return (
    <Providers>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAFAFA' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Trazzo' }} />
      </Stack>
    </Providers>
  );
}