'use client';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import React from 'react';

export default function TourBusinessScreen() {
  const { updateUser } = useAuthStore();
  const [businessName, setBusinessName] = React.useState('');
  const [error, setError] = React.useState('');

  const validateBusinessName = (value: string): boolean => {
    // Permitir letras, números, espacios y algunos caracteres comunes para nombres de negocio
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\&]+$/;
    if (!regex.test(value)) {
      setError('El nombre solo puede contener letras, números, espacios, guiones, puntos y &');
      return false;
    }
    if (value.trim().length < 2) {
      setError('El nombre del negocio debe tener al menos 2 caracteres');
      return false;
    }
    setError('');
    return true;
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    if (validateBusinessName(businessName)) {
      updateUser({ businessName: businessName.trim() });
      router.push('/tour/category');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>Paso 2 de 3</Text>
        <Text style={styles.title}>¿Cómo se llama tu negocio?</Text>
        <Text style={styles.subtitle}>
          El nombre de tu tienda, puesto o emprendimiento
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Nombre de tu negocio"
          placeholderTextColor="#A1A1AA"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={50}
          onBlur={() => validateBusinessName(businessName)}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          businessName.trim().length >= 2 && !error ? styles.continueButtonActive : styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={businessName.trim().length < 2 || !!error}
      >
        <Text style={styles.continueButtonText}>Confirmar</Text>
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