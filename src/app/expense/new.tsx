'use client';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, Alert } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useDatabase } from '../../hooks/useDatabase';
import React, { useState, useCallback } from 'react';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const formatDateForDB = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const EXPENSE_CATEGORIES = [
  { value: 'renta', label: 'Renta', icon: '🏠' },
  { value: 'servicios', label: 'Servicios', icon: '💡' },
  { value: 'insumos', label: 'Insumos', icon: '📦' },
  { value: 'salario', label: 'Salario', icon: '👥' },
  { value: 'otros', label: 'Otros', icon: '📋' },
];

export default function NewExpenseScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const db = useDatabase();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'renta' | 'servicios' | 'insumos' | 'salario' | 'otros'>('insumos');
  const [date, setDate] = useState(formatDateForDB(new Date()));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userId = user?.id;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (description.trim().length < 3) {
      newErrors.description = 'La descripción debe tener al menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userId) return;

    setLoading(true);
    const expenseId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      db.createExpense({
        id: expenseId,
        user_id: userId,
        date,
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        note: note.trim() || undefined,
      });

      router.replace('/movements');
    } catch (err) {
      console.error('Error saving expense:', err);
      Alert.alert('Error', 'No se pudo guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Registrar gasto</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Monto</Text>
          <TextInput
            style={[
              styles.input,
              errors.amount && styles.inputError,
            ]}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor="#A1A1AA"
            autoFocus
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Descripción</Text>
          <TextInput
            style={[
              styles.input,
              errors.description && styles.inputError,
            ]}
            placeholder="Ej: Compra de mercancía, pago de luz..."
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#A1A1AA"
            autoCapitalize="sentences"
            maxLength={100}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoría</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  category === cat.value && styles.categoryButtonSelected,
                ]}
                onPress={() => setCategory(cat.value as any)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  category === cat.value && styles.categoryLabelSelected,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fecha</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => {}}>
            <Text style={styles.dateButtonText}>{date}</Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nota (opcional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Notas adicionales sobre este gasto..."
            value={note}
            onChangeText={setNote}
            placeholderTextColor="#A1A1AA"
            autoCapitalize="sentences"
            maxLength={200}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Guardando...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Guardar gasto</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#27272A',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#18181B',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
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
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#18181B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27272A',
  },
  categoryLabelSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#18181B',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});