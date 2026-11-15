'use client';

import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import React from 'react';

const categoryLabels: Record<string, string> = {
  alimentos: 'Alimentos',
  abarrotes: 'Abarrotes',
  ropa: 'Ropa',
  catalogo: 'Venta por catálogo',
  otro: 'Otro',
};

const categoryIcons: Record<string, string> = {
  alimentos: '🍔',
  abarrotes: '🛒',
  ropa: '👕',
  catalogo: '📋',
  otro: '📦',
};

export default function TourConfirmationScreen() {
  const { user, completeOnboarding } = useAuthStore();

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
            <Text style={styles.fieldValue}>
              {user?.businessType
                ? `${categoryIcons[user.businessType]} ${categoryLabels[user.businessType]}`
                : 'No establecido'}
            </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    color: '#18181B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#27272A',
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
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
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
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181B',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F4F4F5',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E4E7',
    marginHorizontal: 20,
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
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});