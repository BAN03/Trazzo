import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import { BottomTabBar } from '../components/BottomTabBar';
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
  formatMonthLabel,
  getMonthBounds,
  parseDateKey,
  toDateKey,
} from '../utils/date';
import { formatQuantity } from '../utils/numbers';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  renta: 'Renta',
  servicios: 'Servicios',
  insumos: 'Insumos',
  salario: 'Salario',
  otros: 'Otros',
};

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  renta: '#6366F1',
  servicios: '#3B82F6',
  insumos: '#10B981',
  salario: '#F59E0B',
  otros: '#A1A1AA',
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

interface WeekBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export default function ReportsScreen() {
  const user = useAuthStore((state) => state.user);
  const db = useDatabase();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [income, setIncome] = useState({ total: 0, count: 0 });
  const [expenses, setExpenses] = useState({ total: 0, count: 0 });
  const [topProducts, setTopProducts] = useState<
    { product_name: string; total_quantity: number; total_revenue: number }[]
  >([]);
  const [expenseByCategory, setExpenseByCategory] = useState<{ category: string; total: number }[]>(
    []
  );
  const [weeklyData, setWeeklyData] = useState<WeekBucket[]>([]);
  const [inventoryValue, setInventoryValue] = useState({ products: 0, supplies: 0 });
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  const monthBounds = useMemo(() => getMonthBounds(currentMonth), [currentMonth]);

  const loadData = useCallback(() => {
    if (!userId || !db.initialized) return;

    setLoading(true);
    try {
      const incomeStats = db.getSalesStats(userId, monthBounds.start, monthBounds.end);
      const expenseStats = db.getExpensesStats(userId, monthBounds.start, monthBounds.end);
      const top = db.getTopProducts(userId, monthBounds.start, monthBounds.end, 5);
      const expenseRows = db.getExpenses(userId, monthBounds.start, monthBounds.end);
      const salesRows = db.getSales(userId, monthBounds.start, monthBounds.end);
      const catalog = db.getProducts(userId);

      const perDay = new Map<string, { income: number; expense: number }>();
      for (const sale of salesRows) {
        if (sale.status !== 'cobrada') continue;
        const entry = perDay.get(sale.date) ?? { income: 0, expense: 0 };
        entry.income += sale.total_amount;
        perDay.set(sale.date, entry);
      }
      for (const expense of expenseRows) {
        const entry = perDay.get(expense.date) ?? { income: 0, expense: 0 };
        entry.expense += expense.amount;
        perDay.set(expense.date, entry);
      }

      const startDate = parseDateKey(monthBounds.start) ?? new Date();
      const endDate = parseDateKey(monthBounds.end) ?? new Date();
      const totalDays = endDate.getDate();
      const weekCount = Math.max(1, Math.ceil(totalDays / 7));
      const buckets: WeekBucket[] = Array.from({ length: weekCount }, (_, index) => ({
        key: `week-${index + 1}`,
        label: `Sem ${index + 1}`,
        income: 0,
        expense: 0,
      }));

      for (let day = 1; day <= totalDays; day += 1) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth(), day);
        const entry = perDay.get(toDateKey(date));
        if (!entry) continue;
        const bucket = buckets[Math.floor((day - 1) / 7)];
        if (!bucket) continue;
        bucket.income += entry.income;
        bucket.expense += entry.expense;
      }

      const categoryTotals = new Map<string, number>();
      for (const expense of expenseRows) {
        categoryTotals.set(
          expense.category,
          (categoryTotals.get(expense.category) ?? 0) + expense.amount
        );
      }
      const categories = Array.from(categoryTotals.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      const productInventory = catalog
        .filter((item) => item.type === 'product')
        .reduce((sum, item) => sum + item.sale_price * item.stock, 0);
      const supplyInventory = catalog
        .filter((item) => item.type === 'supply')
        .reduce((sum, item) => sum + item.cost_price * item.stock, 0);

      setIncome({ total: incomeStats.total_amount, count: incomeStats.total_sales });
      setExpenses({ total: expenseStats.total_amount, count: expenseStats.total_expenses });
      setTopProducts(
        top.map((row) => ({
          product_name: row.product_name,
          total_quantity: row.total_quantity,
          total_revenue: row.total_revenue,
        }))
      );
      setExpenseByCategory(categories);
      setWeeklyData(buckets);
      setInventoryValue({ products: productInventory, supplies: supplyInventory });
    } catch (error) {
      console.error('Error al cargar informes:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, db, monthBounds.start, monthBounds.end]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const profit = income.total - expenses.total;
  const margin = income.total > 0 ? (profit / income.total) * 100 : 0;
  const canGoBack = canGoToPreviousMonth(currentMonth);
  const canGoForward = canGoToNextMonth(currentMonth);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && canGoBack) {
      setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1));
    }
    if (direction === 'next' && canGoForward) {
      setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));
    }
  };

  const weeklyMax = Math.max(...weeklyData.flatMap((week) => [week.income, week.expense]), 1);
  const topRevenueMax = Math.max(...topProducts.map((item) => item.total_revenue), 1);
  const expenseMax = Math.max(...expenseByCategory.map((item) => item.total), 1);

  if (!db.initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Informes</Text>
            <Text style={styles.subtitle}>Resumen de tu negocio</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Ajustes de la cuenta"
          >
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={[styles.monthNavButton, !canGoBack && styles.monthNavButtonDisabled]}
            onPress={() => handleMonthChange('prev')}
            disabled={!canGoBack}
            accessibilityLabel="Mes anterior"
          >
            <Text style={[styles.monthNavIcon, !canGoBack && styles.monthNavIconDisabled]}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{capitalize(formatMonthLabel(currentMonth))}</Text>

          <TouchableOpacity
            style={[styles.monthNavButton, !canGoForward && styles.monthNavButtonDisabled]}
            onPress={() => handleMonthChange('next')}
            disabled={!canGoForward}
            accessibilityLabel="Mes siguiente"
          >
            <Text style={[styles.monthNavIcon, !canGoForward && styles.monthNavIconDisabled]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ventas</Text>
            <Text style={styles.summaryValueIncome}>
              {currencyFormatter.format(income.total)}
            </Text>
            <Text style={styles.summaryMeta}>
              {income.count} {income.count === 1 ? 'venta' : 'ventas'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={styles.summaryValueExpense}>
              {currencyFormatter.format(expenses.total)}
            </Text>
            <Text style={styles.summaryMeta}>
              {expenses.count} {expenses.count === 1 ? 'registro' : 'registros'}
            </Text>
          </View>
        </View>

        <View style={styles.profitCard}>
          <View>
            <Text style={styles.profitLabel}>Ganancia neta</Text>
            <Text
              style={[
                styles.profitValue,
                profit >= 0 ? styles.profitPositive : styles.profitNegative,
              ]}
            >
              {currencyFormatter.format(profit)}
            </Text>
          </View>
          <View style={styles.marginBadge}>
            <Text style={styles.marginLabel}>Margen</Text>
            <Text
              style={[
                styles.marginValue,
                profit >= 0 ? styles.profitPositive : styles.profitNegative,
              ]}
            >
              {income.total > 0 ? `${margin.toFixed(0)}%` : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ventas vs gastos por semana</Text>
          {income.total === 0 && expenses.total === 0 ? (
            <Text style={styles.emptyText}>Sin movimientos este mes</Text>
          ) : (
            <>
              <View style={styles.chartBars}>
                {weeklyData.map((week) => (
                  <View key={week.key} style={styles.chartBarGroup}>
                    <View style={styles.chartBarsWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: Math.max((week.income / weeklyMax) * 140, 2) },
                        ]}
                      />
                      <View
                        style={[
                          styles.chartBar,
                          styles.chartBarExpense,
                          { height: Math.max((week.expense / weeklyMax) * 140, 2) },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{week.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Ingresos</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Gastos</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Productos más vendidos</Text>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no hay ventas este mes</Text>
          ) : (
            <View style={styles.rankList}>
              {topProducts.map((product, index) => (
                <View key={`${product.product_name}-${index}`} style={styles.rankRow}>
                  <View style={styles.rankHeader}>
                    <Text style={styles.rankName} numberOfLines={1}>
                      {index + 1}. {product.product_name}
                    </Text>
                    <Text style={styles.rankValue}>
                      {currencyFormatter.format(product.total_revenue)}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max((product.total_revenue / topRevenueMax) * 100, 4)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.rankMeta}>
                    {formatQuantity(product.total_quantity)} vendidos
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Gastos por categoría</Text>
          {expenseByCategory.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no hay gastos este mes</Text>
          ) : (
            <View style={styles.rankList}>
              {expenseByCategory.map((item) => {
                const color = EXPENSE_CATEGORY_COLORS[item.category] ?? '#A1A1AA';
                return (
                  <View key={item.category} style={styles.rankRow}>
                    <View style={styles.rankHeader}>
                      <Text style={styles.rankName}>
                        {EXPENSE_CATEGORY_LABELS[item.category] ?? item.category}
                      </Text>
                      <Text style={styles.rankValue}>{currencyFormatter.format(item.total)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: color,
                            width: `${Math.max((item.total / expenseMax) * 100, 4)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Valor del inventario</Text>
          <View style={styles.inventoryRow}>
            <Text style={styles.inventoryLabel}>Productos (a precio de venta)</Text>
            <Text style={styles.inventoryValue}>
              {currencyFormatter.format(inventoryValue.products)}
            </Text>
          </View>
          <View style={styles.inventoryRowLast}>
            <Text style={styles.inventoryLabel}>Insumos (a costo)</Text>
            <Text style={styles.inventoryValue}>
              {currencyFormatter.format(inventoryValue.supplies)}
            </Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>📊</Text>
          <Text style={styles.noteText}>
            La exportación a Excel y los reportes avanzados llegarán en una próxima actualización.
          </Text>
        </View>
      </ScrollView>

      <BottomTabBar active="reports" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#18181B',
  },
  subtitle: {
    fontSize: 14,
    color: '#27272A',
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 16,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavButtonDisabled: {
    opacity: 0.3,
  },
  monthNavIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#27272A',
  },
  monthNavIconDisabled: {
    color: '#A1A1AA',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValueIncome: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  summaryValueExpense: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
  },
  summaryMeta: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 4,
  },
  profitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  profitValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  profitPositive: {
    color: '#10B981',
  },
  profitNegative: {
    color: '#EF4444',
  },
  marginBadge: {
    alignItems: 'flex-end',
  },
  marginLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  marginValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    paddingVertical: 12,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 170,
    paddingTop: 8,
  },
  chartBarGroup: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  chartBarsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 140,
  },
  chartBar: {
    width: 12,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  chartBarExpense: {
    backgroundColor: '#EF4444',
  },
  chartLabel: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  rankList: {
    gap: 14,
  },
  rankRow: {
    gap: 6,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
    flex: 1,
  },
  rankValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27272A',
  },
  rankMeta: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4F4F5',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    gap: 12,
  },
  inventoryRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    gap: 12,
  },
  inventoryLabel: {
    fontSize: 14,
    color: '#27272A',
    flex: 1,
  },
  inventoryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F0FF',
    borderRadius: 12,
    padding: 14,
  },
  noteIcon: {
    fontSize: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#4F46E5',
    lineHeight: 19,
  },
});
