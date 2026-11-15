'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { BottomTabBar } from '../components/BottomTabBar';

export default function ReportsScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Informes</Text>
            <Text style={styles.subtitle}>Reportes y análisis</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* Disabled Notice */}
        <View style={styles.disabledCard}>
          <Text style={styles.disabledIcon}>📊</Text>
          <Text style={styles.disabledTitle}>Sección en desarrollo</Text>
          <Text style={styles.disabledText}>
            La generación de informes de Excel y reportes avanzados
            estará disponible en una próxima actualización.
          </Text>
          <View style={styles.disabledFeatures}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📈</Text>
              <Text style={styles.featureText}>Reporte de ventas mensual</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureText}>Reporte de gastos por categoría</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📦</Text>
              <Text style={styles.featureText}>Inventario valorado</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Exportar a Excel</Text>
            </View>
          </View>
        </View>

        {/* Current available data preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Disponible actualmente</Text>
          <View style={styles.previewItems}>
            <View style={styles.previewItem}>
              <Text style={styles.previewItemIcon}>🏠</Text>
              <View>
                <Text style={styles.previewItemTitle}>Dashboard en Inicio</Text>
                <Text style={styles.previewItemDesc}>Ventas vs gastos semanales, top productos, ganancia neta</Text>
              </View>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewItemIcon}>💰</Text>
              <View>
                <Text style={styles.previewItemTitle}>Movimientos</Text>
                <Text style={styles.previewItemDesc}>Listado completo de ventas y gastos con filtros por mes</Text>
              </View>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewItemIcon}>📦</Text>
              <View>
                <Text style={styles.previewItemTitle}>Catálogo</Text>
                <Text style={styles.previewItemDesc}>Valor de inventario y alertas de stock bajo</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active="reports" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#18181B',
  },
  subtitle: {
    fontSize: 14,
    color: '#27272A',
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
  },
  disabledIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  disabledTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
    textAlign: 'center',
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 14,
    color: '#27272A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  disabledFeatures: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27272A',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 16,
  },
  previewItems: {
    gap: 12,
  },
  previewItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  previewItemIcon: {
    fontSize: 24,
  },
  previewItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 2,
  },
  previewItemDesc: {
    fontSize: 12,
    color: '#A1A1AA',
  },
});