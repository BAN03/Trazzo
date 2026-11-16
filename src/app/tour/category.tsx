'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { BUSINESS_TYPES } from '../../utils/business';
import React from 'react';

export default function TourCategoryScreen() {
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
              <Text style={styles.categoryIcon}>{category.icon}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  categoriesContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
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
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#18181B',
    flex: 1,
  },
  categoryLabelSelected: {
    color: '#6366F1',
    fontWeight: '600',
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