'use client';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useDatabase } from '../../hooks/useDatabase';
import React, { useState, useCallback, useEffect } from 'react';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const formatDateForDB = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const UNITS = ['pz', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'unidad', 'paquete', 'caja'];

export default function EditProductScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const db = useDatabase();
  const params = useLocalSearchParams();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('0');
  const [unit, setUnit] = useState('pz');
  const [expires, setExpires] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  const userId = user?.id;
  const productId = params.id as string;

  useEffect(() => {
    if (productId && db.initialized && !initialized) {
      const product = db.getProduct(productId);
      if (product) {
        setName(product.name);
        setCategory(product.category);
        setSalePrice(String(product.sale_price));
        setCostPrice(String(product.cost_price));
        setStock(String(product.stock));
        setMinStock(String(product.min_stock));
        setUnit(product.unit);
        setExpires(product.expires === 1);
        setExpiryDate(product.expiry_date || '');
        setInitialized(true);
      }
    }
  }, [productId, db.initialized, initialized]);

  const validateName = (value: string): boolean => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(value)) {
      setErrors(prev => ({ ...prev, name: 'El nombre solo puede contener letras y espacios' }));
      return false;
    }
    if (value.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'El nombre debe tener al menos 2 caracteres' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: '' }));
    return true;
  };

  const validateCategory = (value: string): boolean => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(value)) {
      setErrors(prev => ({ ...prev, category: 'La categoría solo puede contener letras y espacios' }));
      return false;
    }
    if (value.trim().length < 2) {
      setErrors(prev => ({ ...prev, category: 'La categoría debe tener al menos 2 caracteres' }));
      return false;
    }
    setErrors(prev => ({ ...prev, category: '' }));
    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (!validateName(name)) {
    }

    if (!category.trim()) {
      newErrors.category = 'La categoría es obligatoria';
    } else if (!validateCategory(category)) {
    }

    if (!salePrice || parseFloat(salePrice) <= 0) {
      newErrors.salePrice = 'El precio de venta debe ser mayor a 0';
    }

    if (!costPrice || parseFloat(costPrice) < 0) {
      newErrors.costPrice = 'El costo no puede ser negativo';
    }

    if (parseFloat(stock) < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    if (parseFloat(minStock) < 0) {
      newErrors.minStock = 'El stock mínimo no puede ser negativo';
    }

    if (expires && !expiryDate) {
      newErrors.expiryDate = 'Debes seleccionar una fecha de caducidad';
    }

    if (expiryDate) {
      const selectedDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.expiryDate = 'La fecha de caducidad no puede ser anterior a hoy';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userId) return;

    setLoading(true);

    try {
      db.updateProduct(productId, {
        name: name.trim(),
        category: category.trim(),
        sale_price: parseFloat(salePrice),
        cost_price: parseFloat(costPrice),
        stock: parseInt(stock),
        min_stock: parseInt(minStock),
        unit,
        expires: expires ? 1 : 0,
        expiry_date: expires ? expiryDate : undefined,
      });

      router.replace('/catalog');
    } catch (err) {
      console.error('Error updating product:', err);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          db.deleteProduct(productId);
          router.replace('/catalog');
        }},
      ]
    );
  };

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

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
          <Text style={styles.screenTitle}>Editar producto</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nombre</Text>
          <TextInput
            style={[
              styles.input,
              errors.name && styles.inputError,
            ]}
            placeholder="Nombre del producto"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#A1A1AA"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
            onBlur={() => validateName(name)}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoría</Text>
          <TextInput
            style={[
              styles.input,
              errors.category && styles.inputError,
            ]}
            placeholder="Ej: Bebidas, Snacks, Lácteos..."
            value={category}
            onChangeText={setCategory}
            placeholderTextColor="#A1A1AA"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
            onBlur={() => validateCategory(category)}
          />
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        {/* Prices Row */}
        <View style={styles.pricesRow}>
          <View style={styles.priceInputContainer}>
            <Text style={styles.sectionLabel}>Precio de venta</Text>
            <TextInput
              style={[
                styles.input,
                errors.salePrice && styles.inputError,
              ]}
              placeholder="0.00"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#A1A1AA"
            />
            {errors.salePrice && <Text style={styles.errorText}>{errors.salePrice}</Text>}
          </View>

          <View style={styles.priceInputContainer}>
            <Text style={styles.sectionLabel}>Costo del producto</Text>
            <TextInput
              style={[
                styles.input,
                errors.costPrice && styles.inputError,
              ]}
              placeholder="0.00"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#A1A1AA"
            />
            {errors.costPrice && <Text style={styles.errorText}>{errors.costPrice}</Text>}
          </View>
        </View>

        {/* Stock Row */}
        <View style={styles.pricesRow}>
          <View style={styles.priceInputContainer}>
            <Text style={styles.sectionLabel}>Stock actual</Text>
            <TextInput
              style={[
                styles.input,
                errors.stock && styles.inputError,
              ]}
              placeholder="0"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholderTextColor="#A1A1AA"
            />
            {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
          </View>

          <View style={styles.priceInputContainer}>
            <Text style={styles.sectionLabel}>Stock mínimo</Text>
            <TextInput
              style={[
                styles.input,
                errors.minStock && styles.inputError,
              ]}
              placeholder="0"
              value={minStock}
              onChangeText={setMinStock}
              keyboardType="numeric"
              placeholderTextColor="#A1A1AA"
            />
            {errors.minStock && <Text style={styles.errorText}>{errors.minStock}</Text>}
          </View>
        </View>

        {/* Unit Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Unidad</Text>
          <View style={styles.unitSelector}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.unitButton,
                  unit === u && styles.unitButtonSelected,
                ]}
                onPress={() => setUnit(u)}
              >
                <Text style={[
                  styles.unitButtonText,
                  unit === u && styles.unitButtonTextSelected,
                ]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Expiry Switch */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.sectionLabel}>¿Caduca?</Text>
              <Text style={styles.switchSubtext}>Indica si este producto tiene fecha de caducidad</Text>
            </View>
            <Switch
              trackColor={{ false: '#E4E4E7', true: '#6366F1' }}
              thumbColor={expires ? '#FFFFFF' : '#A1A1AA'}
              value={expires}
              onValueChange={setExpires}
            />
          </View>
        </View>

        {/* Expiry Date */}
        {expires && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Fecha de caducidad</Text>
            <TouchableOpacity style={[
              styles.dateButton,
              errors.expiryDate && styles.dateButtonError,
            ]} onPress={() => {}}>
              <Text style={styles.dateButtonText}>
                {expiryDate || 'Seleccionar fecha'}
              </Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </TouchableOpacity>
            {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Eliminar producto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Guardando...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Actualizar producto</Text>
            )}
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 16,
    color: '#27272A',
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
    marginBottom: 20,
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
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
  pricesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  unitButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27272A',
  },
  unitButtonTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchSubtext: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
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
  dateButtonError: {
    borderColor: '#EF4444',
  },
  dateButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#18181B',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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