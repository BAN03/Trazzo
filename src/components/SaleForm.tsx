import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../constants/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import { DatePickerModal } from './DatePickerModal';
import { AppIcon } from './AppIcon';
import {
  addDays,
  formatDateKeyLong,
  getMonthBounds,
  toDateKey,
  todayKey,
} from '../utils/date';
import { formatQuantity, roundQuantity, sanitizeDecimal } from '../utils/numbers';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
  { value: 'transferencia', label: 'Transferencia', icon: 'phone-portrait-outline' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'card-outline' },
  { value: 'otro', label: 'Otro', icon: 'cube-outline' },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

interface DraftItem {
  key: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cost_price: number;
}

interface SaleFormProps {
  mode: 'create' | 'edit';
  saleId?: string;
}

const makeKey = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export function SaleForm({ mode, saleId }: SaleFormProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const isEditing = mode === 'edit';
  const user = useAuthStore((state) => state.user);
  const db = useDatabase();
  const userId = user?.id;

  const [date, setDate] = useState(todayKey());
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [originalQuantities, setOriginalQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSale, setLoadingSale] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const minimumDate = useMemo(() => toDateKey(addDays(new Date(), -90)), []);
  const maximumDate = todayKey();
  /** Al editar una venta antigua permitimos conservar su fecha original. */
  const effectiveMinimumDate =
    originalDate && originalDate < minimumDate ? originalDate : minimumDate;

  const products = useMemo(() => {
    if (!userId || !db.initialized) return [];
    return db.getProducts(userId, 'product');
  }, [userId, db]);

  const topProducts = useMemo(() => {
    if (!userId || !db.initialized) return products.slice(0, 5);
    const { start, end } = getMonthBounds(new Date());
    try {
      const ranked = db.getTopProducts(userId, start, end, 6);
      const seen = new Set<string>();
      const result = [] as typeof products;
      for (const row of ranked) {
        const product = products.find((p) => p.id === row.product_id);
        if (product && !seen.has(product.id)) {
          seen.add(product.id);
          result.push(product);
        }
      }
      for (const product of products) {
        if (result.length >= 5) break;
        if (!seen.has(product.id)) {
          seen.add(product.id);
          result.push(product);
        }
      }
      return result.slice(0, 5);
    } catch {
      return products.slice(0, 5);
    }
  }, [userId, products, db]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const totals = useMemo(() => {
    const totalAmount = roundQuantity(items.reduce((sum, item) => sum + item.total_price, 0));
    const totalItems = roundQuantity(items.reduce((sum, item) => sum + item.quantity, 0));
    return { totalAmount, totalItems };
  }, [items]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  useEffect(() => {
    if (!isEditing || !saleId || !db.initialized) return;
    const sale = db.getSale(saleId);
    const saleItems = db.getSaleItems(saleId);

    if (!sale) {
      setNotFound(true);
      setLoadingSale(false);
      return;
    }

    setDate(sale.date);
    setOriginalDate(sale.date);
    setPaymentMethod(sale.payment_method);
    setItems(
      saleItems.map((item) => ({
        key: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        cost_price: item.cost_price,
      }))
    );
    setOriginalQuantities(
      saleItems.reduce<Record<string, number>>((acc, item) => {
        acc[item.product_id] = (acc[item.product_id] ?? 0) + item.quantity;
        return acc;
      }, {})
    );
    setLoadingSale(false);
  }, [isEditing, saleId, db.initialized, db]);

  /** Stock disponible considerando lo que esta venta ya había descontado. */
  const availableStock = useCallback(
    (productId: string, currentStock: number) =>
      roundQuantity(currentStock + (isEditing ? originalQuantities[productId] ?? 0 : 0)),
    [isEditing, originalQuantities]
  );

  const addProductQuantity = (productId: string, qty: number): boolean => {
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('La cantidad debe ser un número mayor a 0');
      return false;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      setError('El producto ya no existe');
      return false;
    }

    const alreadyAdded = items
      .filter((item) => item.product_id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
    const maxStock = availableStock(product.id, product.stock);

    if (roundQuantity(alreadyAdded + qty) > roundQuantity(maxStock)) {
      setError(
        `Stock insuficiente. Disponible: ${maxStock} ${product.unit}${
          alreadyAdded > 0 ? ` (ya agregaste ${alreadyAdded})` : ''
        }`
      );
      return false;
    }

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.product_id === productId);
      if (existingIndex >= 0) {
        const next = [...current];
        const existing = next[existingIndex];
        const newQuantity = roundQuantity(existing.quantity + qty);
        next[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          total_price: roundQuantity(newQuantity * existing.unit_price),
        };
        return next;
      }
      return [
        ...current,
        {
          key: makeKey(),
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          unit_price: product.sale_price,
          total_price: roundQuantity(product.sale_price * qty),
          cost_price: product.cost_price,
        },
      ];
    });

    return true;
  };

  const selectProduct = (productId: string) => {
    if (addProductQuantity(productId, 1)) {
      setSelectedProductId(null);
      setQuantity('1');
      setShowProductSearch(false);
      setSearchQuery('');
      setError('');
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      setError('Selecciona un producto');
      return;
    }

    const clean = sanitizeDecimal(quantity);
    const qty = roundQuantity(Number(clean));
    if (addProductQuantity(selectedProductId, qty)) {
      setSelectedProductId(null);
      setQuantity('1');
      setError('');
    }
  };

  const canIncreaseItem = (item: DraftItem) => {
    const product = products.find((candidate) => candidate.id === item.product_id);
    if (!product) return false;
    const sameProductQuantity = items
      .filter((candidate) => candidate.product_id === item.product_id)
      .reduce((sum, candidate) => sum + candidate.quantity, 0);
    return roundQuantity(sameProductQuantity + 1) <=
      roundQuantity(availableStock(product.id, product.stock));
  };

  const handleRemoveItem = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
    setError('');
  };

  const handleUpdateQuantity = (key: string, nextQuantity: number) => {
    const item = items.find((i) => i.key === key);
    if (!item) return;

    const rounded = roundQuantity(nextQuantity);
    if (rounded <= 0) {
      handleRemoveItem(key);
      return;
    }

    const product = products.find((p) => p.id === item.product_id);
    if (!product) return;

    const others = items
      .filter((i) => i.product_id === item.product_id && i.key !== key)
      .reduce((sum, i) => sum + i.quantity, 0);
    const maxStock = availableStock(product.id, product.stock);

    if (roundQuantity(others + rounded) > roundQuantity(maxStock)) {
      setError(`Stock insuficiente. Disponible: ${maxStock} ${product.unit}`);
      return;
    }

    setItems((current) =>
      current.map((i) =>
        i.key === key
          ? { ...i, quantity: rounded, total_price: roundQuantity(i.unit_price * rounded) }
          : i
      )
    );
    setError('');
  };

  const handleSave = () => {
    if (items.length === 0) {
      setError('Debes agregar al menos un producto');
      return;
    }
    if (!date || date < effectiveMinimumDate || date > maximumDate) {
      setError('La fecha debe estar dentro de los últimos 90 días');
      return;
    }
    if (!userId) {
      setError('Tu sesión no está lista. Intenta de nuevo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing && saleId) {
        db.updateSaleWithItems(
          saleId,
          {
            date,
            total_amount: totals.totalAmount,
            total_items: totals.totalItems,
            payment_method: paymentMethod,
            status: 'cobrada',
          },
          items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            cost_price: item.cost_price,
          }))
        );
      } else {
        db.createSale(
          {
            id: makeKey(),
            user_id: userId,
            date,
            total_amount: totals.totalAmount,
            total_items: totals.totalItems,
            payment_method: paymentMethod,
            status: 'cobrada',
          },
          items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            cost_price: item.cost_price,
          }))
        );
      }

      router.replace('/movements');
    } catch (err) {
      console.error('Error al guardar la venta:', err);
      Alert.alert(
        'No se pudo guardar',
        'Revisa el stock de los productos e intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingSale) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>Venta no encontrada</Text>
        <TouchableOpacity style={styles.backHomeButton} onPress={() => router.replace('/movements')}>
          <Text style={styles.backHomeText}>Volver a movimientos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>
            {isEditing ? 'Editar venta' : 'Registra lo que vendiste'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fecha</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{formatDateKeyLong(date)}</Text>
            <AppIcon name="calendar-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.dateHint}>Puedes registrar ventas de hasta 90 días atrás.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Producto</Text>

          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <AppIcon name="cube-outline" size={42} color={theme.textSecondary} />
              <Text style={styles.emptyProductsTitle}>Aún no tienes productos</Text>
              <Text style={styles.emptyProductsText}>
                Agrega productos a tu catálogo antes de registrar una venta.
              </Text>
              <TouchableOpacity
                style={styles.emptyProductsButton}
                onPress={() => router.push('/catalog')}
              >
                <Text style={styles.emptyProductsButtonText}>Ir al catálogo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto..."
              value={searchQuery}
              onChangeText={(value) => {
                setSearchQuery(value);
                setShowProductSearch(true);
              }}
              onFocus={() => setShowProductSearch(true)}
              placeholderTextColor={theme.textSecondary}
              autoCorrect={false}
            />
          )}

          {!showProductSearch && topProducts.length > 0 && (
            <View style={styles.topProductsContainer}>
              <Text style={styles.topProductsLabel}>Más vendidos</Text>
              <View style={styles.topProductsList}>
                {topProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.topProductButton,
                      selectedProductId === product.id && styles.topProductButtonSelected,
                    ]}
                    onPress={() => selectProduct(product.id)}
                  >
                    <Text style={styles.topProductButtonName} numberOfLines={1}>
                      {product.name}
                    </Text>
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

          {showProductSearch && filteredProducts.length > 0 && (
            <View style={styles.searchResults}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.searchResultItem,
                    selectedProductId === product.id && styles.searchResultItemSelected,
                  ]}
                  onPress={() => selectProduct(product.id)}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{product.name}</Text>
                    <View style={styles.searchResultMeta}>
                      <Text style={styles.searchResultPrice}>
                        {currencyFormatter.format(product.sale_price)} / {product.unit}
                      </Text>
                      <Text
                        style={[
                          styles.searchResultStock,
                          product.stock <= product.min_stock && styles.searchResultStockLow,
                        ]}
                      >
                        Stock: {product.stock} {product.unit}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.searchResultAdd}>+</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showProductSearch && searchQuery.trim().length > 0 && filteredProducts.length === 0 && (
            <Text style={styles.noResults}>No se encontraron productos</Text>
          )}

          {selectedProductId && (
            <View style={styles.quantitySelector}>
              <Text style={styles.quantityLabel}>
                Cantidad{selectedProduct ? ` (${selectedProduct.unit})` : ''}
              </Text>
              <View style={styles.quantityInputContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    setQuantity(
                      formatQuantity(Math.max(0, Number(quantity || 0) - 1))
                    )
                  }
                  accessibilityLabel="Disminuir cantidad"
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={(value) => setQuantity(sanitizeDecimal(value))}
                  keyboardType="decimal-pad"
                  textAlign="center"
                  maxLength={12}
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(formatQuantity(Number(quantity || 0) + 1))}
                  accessibilityLabel="Aumentar cantidad"
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                <Text style={styles.addItemButtonText}>Agregar a la venta</Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Productos en la venta ({items.length})</Text>
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.key} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemPrice}>
                      {currencyFormatter.format(item.unit_price)} × {formatQuantity(item.quantity)}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <Text style={styles.itemTotal}>
                      {currencyFormatter.format(item.total_price)}
                    </Text>
                    <View style={styles.itemStepper}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => handleUpdateQuantity(item.key, item.quantity - 1)}
                        accessibilityLabel={`Quitar uno de ${item.product_name}`}
                      >
                        <Text style={styles.stepperButtonText}>−</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.stepperButton,
                          !canIncreaseItem(item) && styles.stepperButtonDisabled,
                        ]}
                        onPress={() => handleUpdateQuantity(item.key, item.quantity + 1)}
                        disabled={!canIncreaseItem(item)}
                        accessibilityLabel={`Agregar uno de ${item.product_name}`}
                      >
                        <Text style={styles.stepperButtonText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveItem(item.key)}
                        accessibilityLabel={`Quitar ${item.product_name}`}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Método de pago</Text>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === method.value && styles.paymentMethodButtonSelected,
                ]}
                onPress={() => setPaymentMethod(method.value)}
              >
                <AppIcon name={method.icon} size={20} color={theme.primary} />
                <Text
                  style={[
                    styles.paymentMethodLabel,
                    paymentMethod === method.value && styles.paymentMethodLabelSelected,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{currencyFormatter.format(totals.totalAmount)}</Text>
          </View>
          <View style={styles.totalRowLast}>
            <Text style={styles.totalLabel}>Artículos</Text>
            <Text style={styles.totalItems}>{formatQuantity(totals.totalItems)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (items.length === 0 || loading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={items.length === 0 || loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : isEditing ? 'Actualizar venta' : 'Guardar venta'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        title="Fecha de la venta"
        minimumDate={effectiveMinimumDate}
        maximumDate={maximumDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={(value) => {
          setDate(value);
          setError('');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  backHomeButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  backHomeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    color: theme.textSecondary,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: theme.text,
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  dateHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    marginLeft: 4,
  },
  topProductsContainer: {
    marginBottom: 16,
  },
  topProductsLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  topProductsList: {
    gap: 8,
  },
  topProductButton: {
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
  },
  topProductButtonSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primarySoft,
  },
  topProductButtonName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  topProductButtonPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.primary,
    marginBottom: 2,
  },
  topProductButtonStock: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  searchInput: {
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    marginBottom: 12,
  },
  searchResults: {
    gap: 8,
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchResultItemSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primarySoft,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchResultPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  searchResultStock: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  searchResultStockLow: {
    color: theme.danger,
    fontWeight: '600',
  },
  searchResultAdd: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.primary,
    paddingHorizontal: 6,
  },
  noResults: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyProducts: {
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 20,
    gap: 6,
    marginBottom: 12,
  },
  emptyProductsIcon: {
    fontSize: 34,
  },
  emptyProductsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  emptyProductsText: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyProductsButton: {
    marginTop: 8,
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyProductsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quantitySelector: {
    backgroundColor: theme.primarySoft,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
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
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  quantityInput: {
    width: 80,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  addItemButton: {
    backgroundColor: theme.primary,
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
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.success,
  },
  itemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.35,
  },
  stepperButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.danger,
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
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  paymentMethodButtonSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primarySoft,
  },
  paymentMethodIcon: {
    fontSize: 20,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  paymentMethodLabelSelected: {
    color: theme.primary,
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
  totalRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
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
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: theme.backgroundElement,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    color: theme.danger,
    marginTop: 8,
    marginLeft: 4,
  },
});
