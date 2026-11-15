import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';

export default function PrimerArranque() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !user) return;
    router.replace(user.onboardingCompleted ? '/home' : '/welcome');
  }, [hasHydrated, user]);

  if (!hasHydrated) {
    return (
      <View style={styles.container}>
        <Text style={styles.appName}>Trazzo</Text>
        <ActivityIndicator color="#6366F1" size="large" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Trazzo</Text>
        <Text style={styles.appSubtitle}>Tu negocio, bajo control</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/register')}>
          <Text style={styles.secondaryButtonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helperText}>
        Moneda MXN · Datos guardados en este dispositivo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#27272A',
    marginTop: 8,
    fontWeight: '400',
  },
  loader: {
    marginTop: 24,
  },
  buttonsContainer: {
    gap: 16,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27272A',
  },
  helperText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: '#A1A1AA',
  },
});
