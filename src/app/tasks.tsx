'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Lista de tareas</Text>
            <Text style={styles.subtitle}>Recordatorios para tu emprendimiento</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* Disabled Notice */}
        <View style={styles.disabledCard}>
          <Text style={styles.disabledIcon}>✅</Text>
          <Text style={styles.disabledTitle}>Sección en desarrollo</Text>
          <Text style={styles.disabledText}>
            La lista de tareas y recordatorios estará disponible
            en una próxima actualización.
          </Text>
          <View style={styles.disabledFeatures}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📝</Text>
              <Text style={styles.featureText}>Crear tareas con fecha límite</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔔</Text>
              <Text style={styles.featureText}>Notificaciones de recordatorio</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>Marcar como completada</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📅</Text>
              <Text style={styles.featureText}>Vista de calendario</Text>
            </View>
          </View>
        </View>

        {/* Placeholder for future tasks */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No hay tareas aún</Text>
          <Text style={styles.emptyText}>
            Cuando esta función esté disponible, podrás agregar
            recordatorios importantes para tu negocio.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/home')}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/movements')}>
          <Text style={styles.tabIcon}>💰</Text>
          <Text style={styles.tabLabel}>Movimientos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/catalog')}>
          <Text style={styles.tabIcon}>📦</Text>
          <Text style={styles.tabLabel}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItemActive} onPress={() => router.replace('/tasks')}>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabelActive}>Tareas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/reports')}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabLabel}>Informes</Text>
        </TouchableOpacity>
      </View>
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
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabItemActive: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  tabLabelActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
});