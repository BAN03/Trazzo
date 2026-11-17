'use client';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../constants/theme';

import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { AppLogo } from '../components/AppLogo';
import { AppIcon } from '../components/AppIcon';

export default function WelcomeScreen() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const updateUser = useAuthStore((state) => state.updateUser);
  const theme = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    if (hasHydrated && user?.onboardingCompleted) {
      router.replace('/home');
    }
  }, [hasHydrated, user?.onboardingCompleted]);

  const features = [
    {
      icon: 'bar-chart-outline',
      title: 'Registro de Ventas',
      description: 'Registra tus ventas diarias con productos, métodos de pago y fechas.',
    },
    {
      icon: 'cash-outline',
      title: 'Control de Gastos',
      description: 'Lleva un registro de todos tus gastos categorizados (renta, servicios, insumos, etc.).',
    },
    {
      icon: 'cube-outline',
      title: 'Catálogo e Insumos',
      description: 'Administra tus productos e insumos con stock, precios y alertas de stock bajo.',
    },
    {
      icon: 'trending-up-outline',
      title: 'Gráficas y Reportes',
      description: 'Visualiza tus ventas vs gastos semanales y productos más vendidos.',
    },
    {
      icon: 'alert-circle-outline',
      title: 'Alertas Inteligentes',
      description: 'Recibe notificaciones de stock bajo y productos por caducar.',
    },
    {
      icon: 'flag-outline',
      title: 'Enfocado en México',
      description: 'Moneda MXN, formato de fecha local y español mexicano.',
    },
  ] as const;

  const handleStartTour = () => {
    router.push('/tour/name');
  };

  const handleSkip = () => {
    updateUser({ onboardingCompleted: true });
    router.replace('/home');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <AppLogo style={styles.logo} />
        <Text style={[styles.appName, { color: theme.text }]}>Trazzo</Text>
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>¡Bienvenido a Trazzo!</Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
          La app para que tu emprendimiento crezca con control total
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <AppIcon name={feature.icon} size={32} color={theme.primary} />
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStartTour}>
        <Text style={styles.startButtonText}>Empezar Tour</Text>
      </TouchableOpacity>

      <Text style={styles.skipText} onPress={handleSkip}>
        Saltar configuración inicial
      </Text>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 12,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'column',
    alignItems:'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 4,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.textSecondary,
    marginTop: 4,
    lineHeight: 20,
    flex: 1,
  },
  startButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
});