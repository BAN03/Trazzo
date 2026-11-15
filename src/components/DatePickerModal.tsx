import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MONTHS_ES,
  WEEKDAY_LABELS_ES,
  addDays,
  addMonths,
  getCalendarStart,
  parseDateKey,
  startOfMonth,
  toDateKey,
  todayKey,
} from '../utils/date';

interface DatePickerModalProps {
  visible: boolean;
  value?: string;
  title?: string;
  minimumDate?: string;
  maximumDate?: string;
  onClose: () => void;
  onSelect: (dateKey: string) => void;
}

const isWithinRange = (key: string, min?: string, max?: string): boolean => {
  if (min && key < min) return false;
  if (max && key > max) return false;
  return true;
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function DatePickerModal({
  visible,
  value,
  title = 'Selecciona una fecha',
  minimumDate,
  maximumDate,
  onClose,
  onSelect,
}: DatePickerModalProps) {
  const fallback = useMemo(() => {
    const today = todayKey();
    if (isWithinRange(today, minimumDate, maximumDate)) return today;
    return minimumDate ?? maximumDate ?? today;
  }, [minimumDate, maximumDate]);

  const [selected, setSelected] = useState(value || fallback);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => parseDateKey(value || fallback) ?? new Date()
  );

  useEffect(() => {
    if (!visible) return;
    const base = parseDateKey(value || fallback) ?? new Date();
    setSelected(value || fallback);
    setViewMonth(base);
  }, [visible, value, fallback]);

  const cells = useMemo(() => {
    const start = getCalendarStart(viewMonth);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [viewMonth]);

  const canGoPrevious = useMemo(() => {
    const limit = minimumDate ? startOfMonth(parseDateKey(minimumDate) ?? new Date(1970, 0, 1)) : null;
    return !limit || startOfMonth(viewMonth).getTime() > limit.getTime();
  }, [viewMonth, minimumDate]);

  const canGoNext = useMemo(() => {
    const limit = maximumDate
      ? startOfMonth(parseDateKey(maximumDate) ?? new Date(2200, 0, 1))
      : null;
    return !limit || startOfMonth(viewMonth).getTime() < limit.getTime();
  }, [viewMonth, maximumDate]);

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.monthRow}>
            <TouchableOpacity
              style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
              disabled={!canGoPrevious}
              onPress={() => setViewMonth((month) => addMonths(month, -1))}
              accessibilityLabel="Mes anterior"
            >
              <Text style={styles.navIcon}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.monthLabel}>
              {capitalize(MONTHS_ES[viewMonth.getMonth()])} {viewMonth.getFullYear()}
            </Text>

            <TouchableOpacity
              style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
              disabled={!canGoNext}
              onPress={() => setViewMonth((month) => addMonths(month, 1))}
              accessibilityLabel="Mes siguiente"
            >
              <Text style={styles.navIcon}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAY_LABELS_ES.map((day) => (
              <Text key={day} style={styles.weekHeaderText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell) => {
              const key = toDateKey(cell);
              const inMonth = cell.getMonth() === viewMonth.getMonth();
              const enabled = isWithinRange(key, minimumDate, maximumDate);
              const isSelected = key === selected;
              const isToday = key === todayKey();

              return (
                <TouchableOpacity
                  key={key}
                  style={styles.cell}
                  disabled={!enabled}
                  onPress={() => setSelected(key)}
                  accessibilityLabel={key}
                  accessibilityState={{ selected: isSelected, disabled: !enabled }}
                >
                  <View
                    style={[
                      styles.cellInner,
                      isToday && styles.cellToday,
                      isSelected && styles.cellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        !inMonth && styles.cellTextMuted,
                        !enabled && styles.cellTextDisabled,
                        isSelected && styles.cellTextSelected,
                      ]}
                    >
                      {cell.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Seleccionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
    textAlign: 'center',
    marginBottom: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navIcon: {
    fontSize: 22,
    lineHeight: 24,
    color: '#27272A',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekHeaderText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 2,
  },
  cellInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: {
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  cellSelected: {
    backgroundColor: '#6366F1',
  },
  cellText: {
    fontSize: 15,
    color: '#18181B',
  },
  cellTextMuted: {
    color: '#D4D4D8',
  },
  cellTextDisabled: {
    color: '#E4E4E7',
  },
  cellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27272A',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
