import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { addDays, formatDateKeyLong, toDateKey, todayKey } from '../utils/date';
import { sanitizeDecimal } from '../utils/numbers';

const EXPENSE_CATEGORIES = [
  { value: 'renta', label: 'Renta', icon: '🏠' },
  { value: 'servicios', label: 'Servicios', icon: '💡' },
  { value: 'insumos', label: 'Insumos', icon: '📦' },
  { value: 'salario', label: 'Salario', icon: '👥' },
  { value: 'otros', label: 'Otros', icon: '📋' },
] as const;

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];

const makeKey = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

interface ExpenseFormProps {
  mode: 'create' | 'edit';
  expenseId?: string;
}

export function ExpenseForm({ mode, expenseId }: ExpenseFormProps) {
  const isEditing = mode === 'edit';
  const user = useAuthStore((state) => state.user);
  const db = useDatabase();
  const userId = user?.id;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('insumos');
  const [date, setDate] = useState(todayKey());
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);

  const minimumDate = useMemo(() => toDateKey(addDays(new Date(), -90)), []);
  const maximumDate = todayKey();
  /** Al editar un gasto antiguo permitimos conservar su fecha original. */
  const effectiveMinimumDate =
    originalDate && originalDate < minimumDate ? originalDate : minimumDate;

  useEffect(() => {
    if (!isEditing || !expenseId || !db.initialized) return;

    const expense = db.getExpense(expenseId);
    if (!expense) {
      setNotFound(true);
      setLoadingExpense(false);
      return;
    }

    setAmount(String(expense.amount));
    setDescription(expense.description);
    setCategory(expense.category);
    setDate(expense.date);
    setOriginalDate(expense.date);
    setNote(expense.note ?? '');
    setLoadingExpense(false);
  }, [isEditing, expenseId, db.initialized, db]);

  const clearError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    const parsedAmount = Number(amount);
    const trimmedDescription = description.trim();

    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'El monto debe ser un número mayor a 0';
    }

    if (!trimmedDescription) {
      nextErrors.description = 'La descripción es obligatoria';
    } else if (trimmedDescription.length < 3) {
      nextErrors.description = 'La descripción debe tener al menos 3 caracteres';
    } else if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(trimmedDescription)) {
      nextErrors.description = 'La descripción debe contener al menos una letra';
    }

    if (!date) {
      nextErrors.date = 'Selecciona la fecha del gasto';
    } else if (date < effectiveMinimumDate || date > maximumDate) {
      nextErrors.date = 'La fecha debe estar dentro de los últimos 90 días';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!userId) {
      Alert.alert('Sesión no disponible', 'Vuelve a iniciar sesión e intenta de nuevo.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        date,
        amount: parsedAmount,
        description: trimmedDescription,
        category,
        note: note.trim() || undefined,
      };

      if (isEditing && expenseId) {
        db.updateExpense(expenseId, payload);
      } else {
        db.createExpense({
          ...payload,
          id: makeKey(),
          user_id: userId,
        });
      }

      router.replace('/movements');
    } catch (err) {
      console.error('Error al guardar el gasto:', err);
      Alert.alert('No se pudo guardar', 'Revisa los datos e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingExpense) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>Gasto no encontrado</Text>
        <Text style={styles.notFoundText}>
          Puede que se haya eliminado desde movimientos.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/movements')}>
          <Text style={styles.primaryButtonText}>Volver a movimientos</Text>
        </TouchableOpacity>
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Regresar"
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>
            {isEditing ? 'Editar gasto' : 'Registrar gasto'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Monto</Text>
          <TextInput
            style={[styles.input, errors.amount ? styles.inputError : null]}
            placeholder="0.00"
            value={amount}
            onChangeText={(value) => {
              setAmount(sanitizeDecimal(value));
              clearError('amount');
            }}
            keyboardType="decimal-pad"
            placeholderTextColor="#A1A1AA"
          />
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Descripción</Text>
          <TextInput
            style={[styles.input, errors.description ? styles.inputError : null]}
            placeholder="Ej. Compra de mercancía, pago de luz..."
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              clearError('description');
            }}
            placeholderTextColor="#A1A1AA"
            autoCapitalize="sentences"
            maxLength={100}
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoría</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryButton,
                  category === option.value && styles.categoryButtonSelected,
                ]}
                onPress={() => setCategory(option.value)}
              >
                <Text style={styles.categoryIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    category === option.value && styles.categoryLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fecha</Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.date ? styles.inputError : null]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateKeyLong(date)}</Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>
          {errors.date ? (
            <Text style={styles.errorText}>{errors.date}</Text>
          ) : (
            <Text style={styles.dateHint}>Puedes registrar gastos de hasta 90 días atrás.</Text>
          )}
        </View>

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

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar gasto'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        title="Fecha del gasto"
        minimumDate={effectiveMinimumDate}
        maximumDate={maximumDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={(value) => {
          setDate(value);
          clearError('date');
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
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#18181B',
    minHeight: 90,
    textAlignVertical: 'top',
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
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#18181B',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  dateHint: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 8,
    marginLeft: 4,
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
