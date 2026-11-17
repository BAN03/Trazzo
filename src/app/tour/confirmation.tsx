'use client';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../constants/theme';

import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { getBusinessType } from '../../utils/business';
import { AppIcon } from '../../components/AppIcon';
import React from 'react';

export default function TourConfirmationScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { user, completeOnboarding } = useAuthStore();
  const businessType = getBusinessType(user?.businessType);

  const getInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase();
  };

  const handleEditName = () => {
    router.push('/tour/name?edit=1');
  };

  const handleEditBusiness = () => {
    router.push('/tour/business?edit=1');
  };

  const handleEditCategory = () => {
    router.push('/tour/category?edit=1');
  };

  const handleStart = () => {
    if (user?.name && user?.businessName && user?.businessType) {
      completeOnboarding({
        name: user.name,
        businessName: user.businessName,
        businessType: user.businessType,
      });
      router.replace('/home');
    } else {
      Alert.alert('Información incompleta', 'Por favor completa todos los campos');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Revisa tu información</Text>
        <Text style={styles.subtitle}>
          Todo se ve bien, ¿quieres empezar?
        </Text>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial(user?.name || '')}</Text>
        </View>
      </View>

      <View style={styles.fieldsContainer}>
        <View style={styles.fieldRow}>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldLabel}>Nombre de usuario</Text>
            <Text style={styles.fieldValue}>{user?.name || 'No establecido'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditName}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldLabel}>Negocio</Text>
            <Text style={styles.fieldValue}>{user?.businessName || 'No establecido'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditBusiness}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldLabel}>Giro</Text>
            <View style={styles.businessValue}>
              {businessType ? (
                <>
                  <AppIcon name={businessType.icon} size={20} color={theme.primary} />
                  <Text style={styles.fieldValue}>{businessType.label}</Text>
                </>
              ) : (
                <Text style={styles.fieldValue}>No establecido</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditCategory}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>Empezar</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldsContainer: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  businessValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.backgroundElement,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: 20,
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
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});