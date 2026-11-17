import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../constants/theme';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { AppLogo } from '../components/AppLogo';

export default function PrimerArranque() {
  // La redirección a Inicio o al onboarding la resuelve `Stack.Protected`
  // en el layout raíz según el estado de la sesión.
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!hasHydrated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.appName, { color: theme.text }]}>Trazzo</Text>
        <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.logoContainer}>
        <AppLogo style={styles.logo} />
        <Text style={[styles.appName, { color: theme.text }]}>Trazzo</Text>
        <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
          Tu negocio, bajo control
        </Text>
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

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: 20,
  },
  appName: {
    fontSize: 44,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 18,
    color: theme.textSecondary,
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
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: theme.primary,
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
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  helperText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: theme.textSecondary,
  },
});
