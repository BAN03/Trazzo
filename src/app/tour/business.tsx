'use client';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../constants/theme';

import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import React from 'react';

export default function TourBusinessScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { updateUser, user } = useAuthStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditing = edit === '1';
  const [businessName, setBusinessName] = React.useState(user?.businessName ?? '');
  const [error, setError] = React.useState('');

  const validateBusinessName = (value: string): boolean => {
    // Permitir letras, números, espacios y signos comunes para nombres de negocio
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,&'()/]+$/;
    if (!regex.test(value)) {
      setError('El nombre solo puede contener letras, números, espacios y signos como guiones o puntos');
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
      if (isEditing) {
        router.back();
      } else {
        router.push('/tour/category');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.stepText}>{isEditing ? 'Editar negocio' : 'Paso 2 de 3'}</Text>
        <Text style={styles.title}>¿Cómo se llama tu negocio?</Text>
        <Text style={styles.subtitle}>
          El nombre de tu tienda, puesto o emprendimiento
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={(value) => {
            setBusinessName(value);
            if (error) setError('');
          }}
          placeholder="Nombre de tu negocio"
          placeholderTextColor={theme.textSecondary}
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
        <Text style={styles.continueButtonText}>{isEditing ? 'Guardar' : 'Confirmar'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
    marginBottom: 40,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: theme.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  errorText: {
    fontSize: 14,
    color: theme.danger,
    marginTop: 8,
    marginLeft: 4,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: theme.backgroundElement,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});