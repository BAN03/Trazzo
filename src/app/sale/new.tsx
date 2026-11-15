'use client';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useDatabase } from '../../hooks/useDatabase';
import React, { useEffect, useState, useCallback, useMemo } from 'react';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const formatDateForDB = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '📱' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { value: 'otro', label: 'Otro', icon: '📦' },
];

export default function NewSaleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const db = useDatabase();
  const params = useLocalSearchParams();

  const [date, setDate] = useState(formatDateForDB(new Date()));
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'otro'>('efectivo');
  const [items, setItems] = useState<Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    cost_price: number;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = user?.id;

  // Load products
  const products = useMemo(() => {
    if (!userId || !db.initialized) return [];
    return db.getProducts(userId, 'product');
  }, [userId, db.initialized]);

  // Top products for quick access
  const topProducts = useMemo(() => products.slice(0, 5), [products]);

  // Filtered products for search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    return { totalAmount, totalItems };
  }, [items]);

  const validateForm = (): boolean => {
    if (items.length === 0) {
      setError('Debes agregar al menos un producto');
      return false;
    }
    setError('');
    return true;
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      setError('Selecciona un producto');
      return;
    }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < qty) {
      setError(`Stock insuficiente. Disponible: ${product.stock} ${product.unit}`);
      return;
    }

    const existingIndex = items.findIndex(item => item.product_id === selectedProductId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + qty,
        total_price: (newItems[existingIndex].quantity + qty) * product.sale_price,
      };
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          unit_price: product.sale_price,
          total_price: product.sale_price * qty,
          cost_price: product.cost_price,
        },
      ]);
    }

    setSelectedProductId(null);
    setQuantity('1');
    setShowProductSearch(false);
    setError('');
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userId) return;

    setLoading(true);
    const saleId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      db.createSale(
        {
          id: saleId,
          user_id: userId,
          date,
          total_amount: totals.totalAmount,
          total_items: totals.totalItems,
          payment_method: paymentMethod,
          status: 'cobrada',
        },
        items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          cost_price: item.cost_price,
        }))
      );

      router.replace('/movements');
    } catch (err) {
      console.error('Error saving sale:', err);
      Alert.alert('Error', 'No se pudo guardar la venta');
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
          <Text style={styles.screenTitle}>Registra lo que vendiste</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fecha</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => {}}>
            <Text style={styles.dateButtonText}>{date}</Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Product Search */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Producto</Text>

          {/* Top Products Quick Access */}
          {topProducts.length > 0 && (
            <View style={styles.topProductsContainer}>
              <Text style={styles.topProductsLabel}>Más vendidos</Text>
              <View style={styles.topProductsScroll}>
                {topProducts.map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.topProductButton,
                      selectedProductId === product.id && styles.topProductButtonSelected,
                    ]}
                    onPress={() => {
                      setSelectedProductId(product.id);
                      setQuantity('1');
                      setShowProductSearch(false);
                    }}
                  >
                    <Text style={styles.topProductButtonName}>{product.name}</Text>
                    <Text style={styles.topProductButtonPrice}>
                      {currencyFormatter.format(product.sale_price)} / {product.unit}
                    </Text>
                    <Text style={styles.topProductButtonStock}>
                      Stock: {product.stock} {product.unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowProductSearch(true)}
            placeholderTextColor="#A1A1AA"
          />

          {/* Search Results */}
          {showProductSearch && filteredProducts.length > 0 && (
            <View style={styles.searchResults}>
              {filteredProducts.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.searchResultItem,
                    selectedProductId === product.id && styles.searchResultItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedProductId(product.id);
                    setQuantity('1');
                    setShowProductSearch(false);
                  }}
                >
                  <Text style={styles.searchResultName}>{product.name}</Text>
                  <View style={styles.searchResultMeta}>
                    <Text style={styles.searchResultPrice}>
                      {currencyFormatter.format(product.sale_price)} / {product.unit}
                    </Text>
                    <Text style={[
                      styles.searchResultStock,
                      product.stock <= product.min_stock && styles.searchResultStockLow,
                    ]}>
                      Stock: {product.stock} {product.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showProductSearch && filteredProducts.length === 0 && searchQuery && (
            <Text style={styles.noResults}>No se encontraron productos</Text>
          )}

          {/* Selected Product Quantity */}
          {selectedProductId && (
            <View style={styles.quantitySelector}>
              <Text style={styles.quantityLabel}>Cantidad</Text>
              <View style={styles.quantityInputContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  textAlign="center"
                  maxLength={4}
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(String(parseInt(quantity) + 1))}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                <Text style={styles.addItemButtonText}>Agregar a la venta</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Items List */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Productos en la venta ({items.length})</Text>
            <View style={styles.itemsList}>
              {items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemPrice}>
                      {currencyFormatter.format(item.unit_price)} × {item.quantity}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <Text style={styles.itemTotal}>
                      {currencyFormatter.format(item.total_price)}
                    </Text>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(item.id)}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Método de pago</Text>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === method.value && styles.paymentMethodButtonSelected,
                ]}
                onPress={() => setPaymentMethod(method.value as any)}
              >
                <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                <Text style={[
                  styles.paymentMethodLabel,
                  paymentMethod === method.value && styles.paymentMethodLabelSelected,
                ]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{currencyFormatter.format(totals.totalAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Artículos</Text>
            <Text style={styles.totalItems}>{totals.totalItems}</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            items.length === 0 && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={items.length === 0 || loading}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Guardando...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Guardar venta</Text>
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
  topProductsContainer: {
    marginBottom: 16,
  },
  topProductsLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#27272A',
    marginBottom: 8,
  },
  topProductsScroll: {
    gap: 8,
  },
  topProductButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 12,
    minWidth: 140,
  },
  topProductButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
  },
  topProductButtonName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 2,
  },
  topProductButtonPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
    marginBottom: 2,
  },
  topProductButtonStock: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#18181B',
    marginBottom: 12,
  },
  searchResults: {
    gap: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 12,
  },
  searchResultItemSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#18181B',
    marginBottom: 2,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchResultPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  searchResultStock: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  searchResultStockLow: {
    color: '#EF4444',
    fontWeight: '600',
  },
  noResults: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    paddingVertical: 16,
  },
  quantitySelector: {
    backgroundColor: '#F0F0FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 12,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#27272A',
  },
  quantityInput: {
    width: 80,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
  },
  addItemButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addItemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 13,
    color: '#27272A',
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
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
  paymentMethodButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
  },
  paymentMethodIcon: {
    fontSize: 20,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27272A',
  },
  paymentMethodLabelSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  totalContainer: {
    backgroundColor: '#27272A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalItems: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
  saveButtonDisabled: {
    backgroundColor: '#E4E4E7',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
});