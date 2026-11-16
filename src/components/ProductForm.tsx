import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import { useTheme } from '../hooks/useTheme';
import { DatePickerModal } from './DatePickerModal';
import { formatDateKeyLong, todayKey } from '../utils/date';
import { parseAmount, roundQuantity, sanitizeDecimal } from '../utils/numbers';

const UNITS = ['pz', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'unidad', 'paquete', 'caja'];

const NAME_PATTERN = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-&/%'()#+*]+$/;
const CATEGORY_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

const makeKey = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

interface ProductFormProps {
  mode: 'create' | 'edit';
  kind: 'product' | 'supply';
  productId?: string;
}

export function ProductForm({ mode, kind, productId }: ProductFormProps) {
  const theme = useTheme();
  const isEditing = mode === 'edit';
  const isSupply = kind === 'supply';
  const user = useAuthStore((state) => state.user);
  const db = useDatabase();
  const userId = user?.id;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('0');
  const [unit, setUnit] = useState('pz');
  const [expires, setExpires] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);

  const minimumDate = useMemo(() => todayKey(), []);

  useEffect(() => {
    if (!isEditing || !productId || !db.initialized) return;

    const product = db.getProduct(productId);
    if (!product) {
      setNotFound(true);
      setLoadingItem(false);
      return;
    }

    setName(product.name);
    setCategory(product.category);
    setSalePrice(product.sale_price ? String(product.sale_price) : '');
    setCostPrice(product.cost_price ? String(product.cost_price) : '');
    setStock(String(product.stock));
    setMinStock(String(product.min_stock));
    setUnit(product.unit);
    setExpires(product.expires === 1);
    setExpiryDate(product.expiry_date ?? '');
    setLoadingItem(false);
  }, [isEditing, productId, db.initialized, db]);

  const title = isEditing
    ? isSupply
      ? 'Editar insumo'
      : 'Editar producto'
    : isSupply
      ? 'Nuevo insumo'
      : 'Nuevo producto';

  const clearError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const buildErrors = (): Record<string, string> => {
    const next: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();

    if (!trimmedName) {
      next.name = 'El nombre es obligatorio';
    } else if (trimmedName.length < 2) {
      next.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(trimmedName)) {
      next.name = 'El nombre debe contener al menos una letra';
    } else if (!NAME_PATTERN.test(trimmedName)) {
      next.name = 'El nombre solo puede tener letras, números y signos simples';
    }

    if (!isSupply) {
      if (!trimmedCategory) {
        next.category = 'La categoría es obligatoria';
      } else if (trimmedCategory.length < 2) {
        next.category = 'La categoría debe tener al menos 2 caracteres';
      } else if (!CATEGORY_PATTERN.test(trimmedCategory)) {
        next.category = 'La categoría solo puede contener letras y espacios';
      }
    }

    const cost = parseAmount(costPrice);
    if (!costPrice.trim() || Number.isNaN(cost) || cost <= 0) {
      next.costPrice = 'El costo debe ser un número mayor a 0';
    }

    if (!isSupply) {
      const price = parseAmount(salePrice);
      if (!salePrice.trim() || Number.isNaN(price) || price <= 0) {
        next.salePrice = 'El precio de venta debe ser un número mayor a 0';
      } else if (!Number.isNaN(cost) && price < cost) {
        next.salePrice = 'El precio de venta no debería ser menor al costo';
      }
    }

    const stockValue = parseAmount(stock);
    if (!stock.trim() || Number.isNaN(stockValue) || stockValue < 0) {
      next.stock = 'El stock debe ser un número igual o mayor a 0';
    }

    const minStockValue = parseAmount(minStock);
    if (!minStock.trim() || Number.isNaN(minStockValue) || minStockValue < 0) {
      next.minStock = 'El stock mínimo debe ser un número igual o mayor a 0';
    }

    if (expires) {
      if (!expiryDate) {
        next.expiryDate = 'Selecciona la fecha de caducidad';
      } else if (expiryDate < minimumDate) {
        next.expiryDate = 'La fecha de caducidad no puede ser anterior a hoy';
      }
    }

    return next;
  };

  const handleSave = () => {
    const nextErrors = buildErrors();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!userId) {
      Alert.alert('Sesión no disponible', 'Vuelve a iniciar sesión e intenta de nuevo.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        category: isSupply ? 'Insumo' : category.trim(),
        sale_price: isSupply ? 0 : parseAmount(salePrice),
        cost_price: parseAmount(costPrice),
        stock: roundQuantity(parseAmount(stock)),
        min_stock: roundQuantity(parseAmount(minStock)),
        unit,
        expires: expires ? 1 : 0,
        expiry_date: expires && expiryDate ? expiryDate : undefined,
      };

      if (isEditing && productId) {
        db.updateProduct(productId, payload);
      } else {
        db.createProduct({
          ...payload,
          id: makeKey(),
          user_id: userId,
          type: kind,
        });
      }

      router.replace('/catalog');
    } catch (err) {
      console.error('Error al guardar el artículo:', err);
      Alert.alert(
        'No se pudo guardar',
        'Revisa los datos e intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingItem) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>
          {isSupply ? 'Insumo no encontrado' : 'Producto no encontrado'}
        </Text>
        <Text style={styles.notFoundText}>
          Puede que se haya eliminado desde el catálogo.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/catalog')}>
          <Text style={styles.primaryButtonText}>Volver al catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Regresar"
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nombre</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            placeholder={isSupply ? 'Nombre del insumo' : 'Ej. Coca-Cola 600ml'}
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearError('name');
            }}
            placeholderTextColor="#A1A1AA"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={60}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        {!isSupply && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categoría</Text>
            <TextInput
              style={[styles.input, errors.category ? styles.inputError : null]}
              placeholder="Ej. Bebidas"
              value={category}
              onChangeText={(value) => {
                setCategory(value);
                clearError('category');
              }}
              placeholderTextColor="#A1A1AA"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
            />
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Unidad</Text>
          <View style={styles.chipRow}>
            {UNITS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.chip, unit === option && styles.chipSelected]}
                onPress={() => setUnit(option)}
              >
                <Text style={[styles.chipText, unit === option && styles.chipTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!isSupply && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Precio de venta</Text>
            <TextInput
              style={[styles.input, errors.salePrice ? styles.inputError : null]}
              placeholder="0.00"
              value={salePrice}
              onChangeText={(value) => {
                setSalePrice(sanitizeDecimal(value));
                clearError('salePrice');
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#A1A1AA"
            />
            {errors.salePrice ? <Text style={styles.errorText}>{errors.salePrice}</Text> : null}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isSupply ? 'Costo por unidad' : 'Costo'}
          </Text>
          <TextInput
            style={[styles.input, errors.costPrice ? styles.inputError : null]}
            placeholder="0.00"
            value={costPrice}
            onChangeText={(value) => {
              setCostPrice(sanitizeDecimal(value));
              clearError('costPrice');
            }}
            keyboardType="decimal-pad"
            placeholderTextColor="#A1A1AA"
          />
          {errors.costPrice ? <Text style={styles.errorText}>{errors.costPrice}</Text> : null}
        </View>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.sectionLabel}>Stock actual</Text>
            <TextInput
              style={[styles.input, errors.stock ? styles.inputError : null]}
              placeholder="0"
              value={stock}
              onChangeText={(value) => {
                setStock(sanitizeDecimal(value));
                clearError('stock');
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#A1A1AA"
            />
            {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}
          </View>

          <View style={styles.rowItem}>
            <Text style={styles.sectionLabel}>Stock mínimo</Text>
            <TextInput
              style={[styles.input, errors.minStock ? styles.inputError : null]}
              placeholder="0"
              value={minStock}
              onChangeText={(value) => {
                setMinStock(sanitizeDecimal(value));
                clearError('minStock');
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#A1A1AA"
            />
            {errors.minStock ? <Text style={styles.errorText}>{errors.minStock}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>¿Caduca?</Text>
              <Text style={styles.switchSubtext}>
                Actívalo si este artículo tiene fecha de caducidad
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E4E4E7', true: '#6366F1' }}
              thumbColor={expires ? '#FFFFFF' : '#A1A1AA'}
              value={expires}
              onValueChange={(value) => {
                setExpires(value);
                if (!value) {
                  setExpiryDate('');
                  clearError('expiryDate');
                }
              }}
            />
          </View>
        </View>

        {expires && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Fecha de caducidad</Text>
            <TouchableOpacity
              style={[styles.dateButton, errors.expiryDate ? styles.inputError : null]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, !expiryDate && styles.dateButtonPlaceholder]}>
                {expiryDate ? formatDateKeyLong(expiryDate) : 'Seleccionar fecha'}
              </Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </TouchableOpacity>
            {errors.expiryDate ? <Text style={styles.errorText}>{errors.expiryDate}</Text> : null}
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : `Guardar ${isSupply ? 'insumo' : 'producto'}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={expiryDate || minimumDate}
        title="Fecha de caducidad"
        minimumDate={minimumDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={(value) => {
          setExpiryDate(value);
          clearError('expiryDate');
          setShowDatePicker(false);
        }}
      />
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
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27272A',
  },
  notFoundText: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
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
  headerSpacer: {
    width: 44,
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
    fontSize: 17,
    color: '#18181B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27272A',
  },
  chipTextSelected: {
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
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181B',
  },
  switchSubtext: {
    fontSize: 12,
    color: '#71717A',
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
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181B',
  },
  dateButtonPlaceholder: {
    color: '#A1A1AA',
    fontWeight: '400',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#A5A6F6',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
