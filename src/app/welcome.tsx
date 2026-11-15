'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const features = [
    {
      icon: '📊',
      title: 'Registro de Ventas',
      description: 'Registra tus ventas diarias con productos, métodos de pago y fechas.',
    },
    {
      icon: '💰',
      title: 'Control de Gastos',
      description: 'Lleva un registro de todos tus gastos categorizados (renta, servicios, insumos, etc.).',
    },
    {
      icon: '📦',
      title: 'Catálogo e Insumos',
      description: 'Administra tus productos e insumos con stock, precios y alertas de stock bajo.',
    },
    {
      icon: '📈',
      title: 'Gráficas y Reportes',
      description: 'Visualiza tus ventas vs gastos semanales y productos más vendidos.',
    },
    {
      icon: '⚠️',
      title: 'Alertas Inteligentes',
      description: 'Recibe notificaciones de stock bajo y productos por caducar.',
    },
    {
      icon: '🇲🇽',
      title: 'Enfocado en México',
      description: 'Moneda MXN, formato de fecha local y español mexicano.',
    },
  ];

  const handleStartTour = () => {
    router.push('/tour/name');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.appName}>Trazzo</Text>
        <Text style={styles.welcomeTitle}>¡Bienvenido a Trazzo!</Text>
        <Text style={styles.welcomeSubtitle}>
          La app para que tu emprendimiento crezca con control total
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStartTour}>
        <Text style={styles.startButtonText}>Empezar Tour</Text>
      </TouchableOpacity>

      <Text style={styles.skipText} onPress={() => router.replace('/home')}>
        Saltar configuración inicial
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#18181B',
    marginTop: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#27272A',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
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
    color: '#18181B',
    marginTop: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#27272A',
    marginTop: 4,
    lineHeight: 20,
    flex: 1,
  },
  startButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
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
    color: '#6366F1',
    fontWeight: '500',
  },
});