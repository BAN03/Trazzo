'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import React, { useState } from 'react';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout, updateUser } = useAuthStore();
  const db = useDatabase();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => {
          logout();
          router.replace('/');
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción eliminará todos tus datos permanentemente. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          // In a real app, this would delete the user data
          Alert.alert('Información', 'Función de eliminación de cuenta en desarrollo');
        }},
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Ajustes</Text>
            <Text style={styles.subtitle}>Configuración de la aplicación</Text>
          </View>
          <TouchableOpacity style={styles.avatarButton}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.profileRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Usuario'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
              <Text style={styles.profileBusiness}>
                {user?.businessName ? `${user.businessName} • ${user.businessType}` : 'Sin negocio configurado'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push('/tour/confirmation')}>
            <Text style={styles.editProfileButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferencias</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notificaciones</Text>
              <Text style={styles.settingDesc}>Alertas de stock bajo y caducidad</Text>
            </View>
            <Switch
              trackColor={{ false: '#E4E4E7', true: '#6366F1' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#A1A1AA'}
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Modo oscuro</Text>
              <Text style={styles.settingDesc}>Tema oscuro para la aplicación</Text>
            </View>
            <Switch
              trackColor={{ false: '#E4E4E7', true: '#6366F1' }}
              thumbColor={darkModeEnabled ? '#FFFFFF' : '#A1A1AA'}
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Moneda</Text>
              <Text style={styles.settingDesc}>MXN - Peso Mexicano</Text>
            </View>
            <Text style={styles.settingValue}>MXN $</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Idioma</Text>
              <Text style={styles.settingDesc}>Español (México)</Text>
            </View>
            <Text style={styles.settingValue}>Español</Text>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Datos</Text>

          <TouchableOpacity style={styles.dataButton} onPress={() => Alert.alert('Backup', 'Backup a Google Drive en desarrollo')}>
            <View style={styles.dataButtonLeft}>
              <Text style={styles.dataButtonIcon}>☁️</Text>
              <View>
                <Text style={styles.dataButtonLabel}>Backup en Google Drive</Text>
                <Text style={styles.dataButtonDesc}>Respalda tu base de datos en la nube</Text>
              </View>
            </View>
            <Text style={styles.dataButtonChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dataButton} onPress={() => Alert.alert('Exportar', 'Exportar a Excel en desarrollo')}>
            <View style={styles.dataButtonLeft}>
              <Text style={styles.dataButtonIcon}>📊</Text>
              <View>
                <Text style={styles.dataButtonLabel}>Exportar datos</Text>
                <Text style={styles.dataButtonDesc}>Generar reporte en Excel</Text>
              </View>
            </View>
            <Text style={styles.dataButtonChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dataButton} onPress={() => Alert.alert('Limpiar', 'Limpiar datos en desarrollo')}>
            <View style={styles.dataButtonLeft}>
              <Text style={styles.dataButtonIcon}>🗑️</Text>
              <View>
                <Text style={styles.dataButtonLabel}>Limpiar datos locales</Text>
                <Text style={styles.dataButtonDesc}>Elimina todos los datos del dispositivo</Text>
              </View>
            </View>
            <Text style={styles.dataButtonChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Acerca de</Text>

          <View style={styles.aboutRow}>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutLabel}>Versión</Text>
            </View>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutRow}>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutLabel}>Desarrollado para</Text>
            </View>
            <Text style={styles.aboutValue}>Pequeños negocios en México</Text>
          </View>

          <TouchableOpacity style={styles.aboutRow} onPress={() => Alert.alert('Términos', 'Términos y condiciones en desarrollo')}>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutLabel}>Términos y condiciones</Text>
            </View>
            <Text style={styles.aboutChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.aboutRow} onPress={() => Alert.alert('Privacidad', 'Política de privacidad en desarrollo')}>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutLabel}>Política de privacidad</Text>
            </View>
            <Text style={styles.aboutChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionCardDanger}>
          <Text style={styles.sectionTitleDanger}>Zona de peligro</Text>

          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Text style={styles.dangerButtonIcon}>🚪</Text>
            <Text style={styles.dangerButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonIcon}>🗑️</Text>
            <Text style={styles.dangerButtonText}>Eliminar cuenta</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/tasks')}>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabel}>Tareas</Text>
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
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  sectionCardDanger: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  sectionTitleDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 2,
  },
  profileBusiness: {
    fontSize: 13,
    color: '#27272A',
  },
  editProfileButton: {
    backgroundColor: '#F4F4F5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181B',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27272A',
  },
  dataButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  dataButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dataButtonIcon: {
    fontSize: 24,
  },
  dataButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181B',
    marginBottom: 2,
  },
  dataButtonDesc: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  dataButtonChevron: {
    fontSize: 20,
    fontWeight: '300',
    color: '#A1A1AA',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  aboutInfo: {
    flex: 1,
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181B',
  },
  aboutValue: {
    fontSize: 14,
    color: '#27272A',
  },
  aboutChevron: {
    fontSize: 20,
    fontWeight: '300',
    color: '#A1A1AA',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 8,
  },
  dangerButtonIcon: {
    fontSize: 20,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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