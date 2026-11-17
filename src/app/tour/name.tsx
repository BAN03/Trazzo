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

export default function TourNameScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { updateUser, user } = useAuthStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditing = edit === '1';
  const [name, setName] = React.useState(user?.name && user.name !== 'Usuario' ? user.name : '');
  const [error, setError] = React.useState('');

  const validateName = (value: string): boolean => {
    // Solo letras, espacios y signos que forman parte de un nombre (Ana-María, O'Brien)
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'.-]+$/;
    if (!regex.test(value)) {
      setError('El nombre solo puede contener letras, espacios, guiones y apóstrofes');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          placeholderTextColor={theme.textSecondary}
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