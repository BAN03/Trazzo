import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Providers } from '../providers/Providers';
import { useAuthStore } from '../hooks/useAuthStore';
import { useTheme } from '../hooks/useTheme';

export default function RootLayout() {
  const theme = useTheme();

  return (
    <Providers>
      <SafeAreaView
        edges={['top']}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <RootNavigator />
      </SafeAreaView>
    </Providers>
  );
}

/**
 * Agrupa las pantallas según el estado de la sesión.
 *
 * `Stack.Protected` quita del historial las pantallas que dejan de ser
 * accesibles, así que al entrar a Inicio el botón "atrás" de Android ya no
 * regresa al login, al welcome ni al tour.
 */
function RootNavigator() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore(
    (state) => state.user?.onboardingCompleted ?? false
  );

  const isOnboarding = isAuthenticated && !onboardingCompleted;
  const isApp = isAuthenticated && onboardingCompleted;

  return (
    <>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: theme.background },
        }}
      >
      {/* Sin sesión: bienvenida, iniciar sesión y registrarse. */}
      <Stack.Protected
        guard={!isAuthenticated}
        redirectTo={onboardingCompleted ? '/home' : '/welcome'}
      >
        <Stack.Screen name="index" options={{ title: 'Trazzo' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>

      {/* Sesión iniciada pero perfil del negocio pendiente. */}
      <Stack.Protected
        guard={isOnboarding}
        redirectTo={isAuthenticated ? '/home' : '/'}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="tour/name" />
        <Stack.Screen name="tour/business" />
        <Stack.Screen name="tour/category" />
        <Stack.Screen name="tour/confirmation" />
      </Stack.Protected>

      {/* App completa. */}
      <Stack.Protected
        guard={isApp}
        redirectTo={isAuthenticated ? '/welcome' : '/'}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="movements" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="sale/new" />
        <Stack.Screen name="sale/edit/[id]" />
        <Stack.Screen name="expense/new" />
        <Stack.Screen name="expense/edit/[id]" />
        <Stack.Screen name="product/new" />
        <Stack.Screen name="product/edit/[id]" />
        <Stack.Screen name="supply/new" />
        <Stack.Screen name="supply/edit/[id]" />
      </Stack.Protected>
      </Stack>
    </>
  );
}
