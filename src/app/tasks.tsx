'use client';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../constants/theme';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { BottomTabBar } from '../components/BottomTabBar';
import { AppIcon } from '../components/AppIcon';
import { useTabSwipe } from '../hooks/useTabSwipe';

export default function TasksScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const user = useAuthStore((state) => state.user);
  const swipeHandlers = useTabSwipe('/tasks');

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      {...swipeHandlers}
    >
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
          <AppIcon name="checkmark-circle-outline" size={48} color={theme.primary} />
          <Text style={styles.disabledTitle}>Sección en desarrollo</Text>
          <Text style={styles.disabledText}>
            La lista de tareas y recordatorios estará disponible
            en una próxima actualización.
          </Text>
          <View style={styles.disabledFeatures}>
            <View style={styles.featureItem}>
              <AppIcon name="create-outline" size={22} color={theme.primary} />
              <Text style={styles.featureText}>Crear tareas con fecha límite</Text>
            </View>
            <View style={styles.featureItem}>
              <AppIcon name="notifications-outline" size={22} color={theme.primary} />
              <Text style={styles.featureText}>Notificaciones de recordatorio</Text>
            </View>
            <View style={styles.featureItem}>
              <AppIcon name="checkmark-circle-outline" size={22} color={theme.primary} />
              <Text style={styles.featureText}>Marcar como completada</Text>
            </View>
            <View style={styles.featureItem}>
              <AppIcon name="calendar-outline" size={22} color={theme.primary} />
              <Text style={styles.featureText}>Vista de calendario</Text>
            </View>
          </View>
        </View>

        {/* Placeholder for future tasks */}
        <View style={styles.emptyState}>
          <AppIcon name="clipboard-outline" size={48} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>No hay tareas aún</Text>
          <Text style={styles.emptyText}>
            Cuando esta función esté disponible, podrás agregar
            recordatorios importantes para tu negocio.
          </Text>
        </View>
      </ScrollView>

      <BottomTabBar active="tasks" />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
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
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  disabledIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  disabledTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 14,
    color: theme.textSecondary,
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
    backgroundColor: theme.backgroundElement,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  emptyState: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});