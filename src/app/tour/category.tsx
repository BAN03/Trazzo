'use client';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../constants/theme';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { BUSINESS_TYPES } from '../../utils/business';
import { AppIcon } from '../../components/AppIcon';
import React from 'react';

export default function TourCategoryScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { updateUser, user } = useAuthStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditing = edit === '1';
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    user?.businessType ?? null
  );

  const handleContinue = () => {
    if (selectedCategory) {
      updateUser({ businessType: selectedCategory });
      if (isEditing) {
        router.back();
      } else {
        router.push('/tour/confirmation');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>{isEditing ? 'Editar giro' : 'Paso 3 de 3'}</Text>
        <Text style={styles.title}>¿Qué vendes?</Text>
        <Text style={styles.subtitle}>
          Selecciona el giro de tu negocio
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.categoriesContainer}>
        {BUSINESS_TYPES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.id && styles.categoryCardSelected,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <View style={styles.categoryIconContainer}>
              <AppIcon name={category.icon} size={30} color={theme.primary} />
            </View>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === category.id && styles.categoryLabelSelected,
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          selectedCategory ? styles.continueButtonActive : styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedCategory}
      >
        <Text style={styles.continueButtonText}>{isEditing ? 'Guardar' : 'Confirmar'}</Text>
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
    marginBottom: 24,
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
  categoriesContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryCardSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primarySoft,
    shadowColor: theme.primary,
    shadowOpacity: 0.15,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
  },
  categoryLabelSelected: {
    color: theme.primary,
    fontWeight: '600',
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