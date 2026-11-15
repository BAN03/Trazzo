'use client';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import React from 'react';

export default function TourNameScreen() {
  const { updateUser, user } = useAuthStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditing = edit === '1';
  const [name, setName] = React.useState(user?.name && user.name !== 'Usuario' ? user.name : '');
  const [error, setError] = React.useState('');

  const validateName = (value: string): boolean => {
    // No permitir números ni caracteres especiales, solo letras y espacios
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(value)) {
      setError('El nombre solo puede contener letras y espacios');
      return false;
    }
    if (value.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return false;
    }
    setError('');
    return true;
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    if (validateName(name)) {
      updateUser({ name: name.trim() });
      if (isEditing) {
        router.back();
      } else {
        router.push('/tour/business');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>{isEditing ? 'Editar nombre' : 'Paso 1 de 3'}</Text>
        <Text style={styles.title}>¿Cómo te llamas?</Text>
        <Text style={styles.subtitle}>
          Este nombre aparecerá en la aplicación
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (error) setError('');
          }}
          placeholder="Tu nombre"
          placeholderTextColor="#A1A1AA"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={50}
          onBlur={() => validateName(name)}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          name.trim().length >= 2 && !error ? styles.continueButtonActive : styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={name.trim().length < 2 || !!error}
      >
        <Text style={styles.continueButtonText}>{isEditing ? 'Guardar' : 'Confirmar'}</Text>
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
    marginBottom: 40,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#18181B',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#27272A',
    marginTop: 8,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#18181B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#E4E4E7',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});