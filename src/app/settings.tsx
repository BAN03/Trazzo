import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../constants/theme';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { getBusinessTypeLabel } from '../utils/business';
import { AppIcon } from '../components/AppIcon';

const APP_VERSION = '1.0.0';

const UPCOMING_FEATURES = [
  { icon: 'people-outline', label: 'Registro de empleados', description: 'Administra a tu equipo de trabajo' },
  { icon: 'checkmark-circle-outline', label: 'Lista de tareas', description: 'Recordatorios para tu negocio' },
  { icon: 'cloud-outline', label: 'Respaldo en Google Drive', description: 'Copia de seguridad en la nube' },
  { icon: 'bar-chart-outline', label: 'Reportes en Excel', description: 'Exporta tus ventas a una hoja de cálculo' },
  { icon: 'notifications-outline', label: 'Notificaciones', description: 'Avisos de stock bajo y caducidad' },
] as const;

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useTheme();
  const styles = createStyles(theme);

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión? Tus datos se quedan guardados en este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Regresar"
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ajustes</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'Usuario'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'Sin correo'}</Text>
          {user?.businessName ? (
            <Text style={styles.profileBusiness}>
              {user.businessName}
              {user.businessType ? ` • ${getBusinessTypeLabel(user.businessType)}` : ''}
            </Text>
          ) : (
            <Text style={styles.profileBusiness}>Sin negocio configurado</Text>
          )}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/tour/confirmation')}
          >
            <Text style={styles.editProfileButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferencias</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Idioma</Text>
            <Text style={styles.infoValue}>Español (México)</Text>
          </View>
          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>Moneda</Text>
            <Text style={styles.infoValue}>MXN $</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximamente</Text>
          <Text style={styles.cardSubtitle}>
            Estas funciones aún no están disponibles en esta versión.
          </Text>
          {UPCOMING_FEATURES.map((feature, index) => (
            <View
              key={feature.label}
              style={[
                styles.featureRow,
                index === UPCOMING_FEATURES.length - 1 && styles.featureRowLast,
              ]}
            >
              <AppIcon name={feature.icon} size={22} color={theme.primary} />
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Pronto</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tus datos</Text>
          <Text style={styles.cardSubtitle}>
            Toda tu información se guarda únicamente en este dispositivo. Si desinstalas la
            aplicación o borras sus datos, no se podrá recuperar.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acerca de</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>Hecho para</Text>
            <Text style={styles.infoValue}>Pequeños negocios en México</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <AppIcon name="log-out-outline" size={20} color={theme.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    color: theme.textSecondary,
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  profileBusiness: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  editProfileButton: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: theme.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  featureRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  featureDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: theme.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.dangerSoft,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.danger,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.danger,
  },
});
