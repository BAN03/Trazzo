import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import { BottomTabBar } from '../components/BottomTabBar';
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
  formatDateKeyShort,
  formatMonthLabel,
  getMonthBounds,
  getWeekBounds,
  addDays,
  parseDateKey,
  todayKey,
} from '../utils/date';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const db = useDatabase();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [income, setIncome] = useState({ total: 0, count: 0 });
  const [expenses, setExpenses] = useState({ total: 0, count: 0 });
  const [avgSale, setAvgSale] = useState(0);
  const [topProducts, setTopProducts] = useState<
    Array<{ product_name: string; total_quantity: number; total_profit: number }>
  >([]);
  const [weeklyData, setWeeklyData] = useState<
    Array<{ date: string; income: number; expense: number }>
  >([]);
  const [lowStockAlert, setLowStockAlert] = useState<{ name: string; stock: number }[]>([]);
  const [expiringAlert, setExpiringAlert] = useState<
    { name: string; expiry_date: string }[]
  >([]);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Evita que el pop up vuelva a abrirse en cada cambio de estado después de
  // que el usuario lo cerró.
  const alertsAcknowledged = useRef(false);

  const userId = user?.id;
  const monthBounds = useMemo(() => getMonthBounds(currentMonth), [currentMonth]);
  const weekBounds = useMemo(() => getWeekBounds(new Date()), []);

  const loadData = useCallback(() => {
    if (!userId || !db.initialized) return;

    setLoading(true);
    try {
      const incomeStats = db.getSalesStats(userId, monthBounds.start, monthBounds.end);
      const expenseStats = db.getExpensesStats(userId, monthBounds.start, monthBounds.end);
      const topProds = db.getTopProducts(userId, monthBounds.start, monthBounds.end, 4);
      const weekly = db.getWeeklySalesData(userId, weekBounds.start, weekBounds.end);
      const lowStock = db.getLowStockProducts(userId);
      const expiring = db.getExpiringProducts(userId, 7);

      setIncome({ total: incomeStats.total_amount, count: incomeStats.total_sales });
      setExpenses({ total: expenseStats.total_amount, count: expenseStats.total_expenses });
      setAvgSale(incomeStats.avg_sale);
      setTopProducts(topProds);
      setWeeklyData(weekly);
      setLowStockAlert(lowStock.map((p) => ({ name: p.name, stock: p.stock })));
      setExpiringAlert(
        expiring.map((p) => ({ name: p.name, expiry_date: p.expiry_date || '' }))
      );
    } catch (error) {
      console.error('Error al cargar el inicio:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, db, monthBounds.start, monthBounds.end, weekBounds.start, weekBounds.end]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const hasAlerts = lowStockAlert.length > 0 || expiringAlert.length > 0;
    if (hasAlerts && !alertsAcknowledged.current) {
      setShowAlertPopup(true);
    }
  }, [lowStockAlert, expiringAlert]);

  const profit = income.total - expenses.total;
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

  const handleCloseAlert = () => {
    alertsAcknowledged.current = true;
    setShowAlertPopup(false);
  };

  if (!db.initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAlertPopup && (
        <AlertPopup lowStock={lowStockAlert} expiring={expiringAlert} onClose={handleCloseAlert} />
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hola, {user?.name || 'Usuario'}</Text>
            {user?.businessName ? (
              <Text style={styles.businessName}>{user.businessName}</Text>
            ) : null}
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

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Ingresos este mes</Text>
              <Text style={styles.cardValueIncome}>{currencyFormatter.format(income.total)}</Text>
            </View>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {income.count} {income.count === 1 ? 'venta' : 'ventas'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Egresos este mes</Text>
              <Text style={styles.cardValueExpense}>
                {currencyFormatter.format(expenses.total)}
              </Text>
            </View>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {expenses.count} {expenses.count === 1 ? 'registro' : 'registros'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardProfit}>
          <View style={styles.profitRow}>
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
            <View style={styles.avgSaleContainer}>
              <Text style={styles.avgSaleLabel}>Venta promedio</Text>
              <Text style={styles.avgSaleValue}>{currencyFormatter.format(avgSale)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ventas vs gastos de esta semana</Text>
          <WeeklyChart data={weeklyData} weekStart={weekBounds.start} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Productos más vendidos</Text>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyText}>No hay ventas este mes</Text>
          ) : (
            <View style={styles.topProductsList}>
              {topProducts.map((product, index) => (
                <View key={`${product.product_name}-${index}`} style={styles.topProductRow}>
                  <Text style={styles.topProductRank}>#{index + 1}</Text>
                  <View style={styles.topProductInfo}>
                    <Text style={styles.topProductName}>{product.product_name}</Text>
                    <Text style={styles.topProductMeta}>
                      {product.total_quantity} vendidos •{' '}
                      {currencyFormatter.format(product.total_profit)} ganancia
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTabBar active="home" />
    </View>
  );
}

function AlertPopup({
  lowStock,
  expiring,
  onClose,
}: {
  lowStock: { name: string; stock: number }[];
  expiring: { name: string; expiry_date: string }[];
  onClose: () => void;
}) {
  return (
    <View style={styles.alertOverlay}>
      <View style={styles.alertContainer}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertTitle}>Alertas</Text>
        </View>

        {lowStock.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.alertSectionTitle}>Stock bajo</Text>
            {lowStock.map((item, index) => (
              <View key={`stock-${index}`} style={styles.alertItem}>
                <Text style={styles.alertItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.alertItemValue}>{item.stock} unidades</Text>
              </View>
            ))}
          </View>
        )}

        {expiring.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.alertSectionTitle}>Próximos a caducar</Text>
            {expiring.map((item, index) => (
              <View key={`expiry-${index}`} style={styles.alertItem}>
                <Text style={styles.alertItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.alertItemValue}>
                  Caduca: {formatDateKeyShort(item.expiry_date)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.alertCloseButton} onPress={onClose}>
          <Text style={styles.alertCloseButtonText}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WeeklyChart({
  data,
  weekStart,
}: {
  data: Array<{ date: string; income: number; expense: number }>;
  weekStart: string;
}) {
  const chartData = useMemo(() => {
    const start = parseDateKey(weekStart) ?? new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;
      const match = data.find((item) => item.date === key);
      return {
        key,
        label: DAY_LABELS[index],
        accessibleLabel: DAY_NAMES[index],
        income: match?.income ?? 0,
        expense: match?.expense ?? 0,
      };
    });
  }, [data, weekStart]);

  const overallMax = Math.max(...chartData.map((d) => Math.max(d.income, d.expense)), 1);
  const today = todayKey();

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {chartData.map((item) => (
          <View key={item.key} style={styles.chartBarGroup}>
            <View style={styles.chartBarsWrapper}>
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max((item.income / overallMax) * 150, 2) },
                ]}
              />
              <View
                style={[
                  styles.chartBar,
                  styles.chartBarExpense,
                  { height: Math.max((item.expense / overallMax) * 150, 2) },
                ]}
              />
            </View>
            <Text
              style={[styles.chartDayLabel, item.key === today && styles.chartDayLabelToday]}
              accessibilityLabel={item.accessibleLabel}
            >
              {item.label}
            </Text>
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
          <Text style={styles.legendText}>Egresos</Text>
        </View>
      </View>
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
    paddingBottom: 110,
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
    marginBottom: 24,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#18181B',
  },
  businessName: {
    fontSize: 14,
    color: '#A1A1AA',
    marginTop: 2,
    fontWeight: '500',
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
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
    minWidth: 170,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27272A',
    marginBottom: 4,
  },
  cardValueIncome: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
  },
  cardValueExpense: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EF4444',
  },
  cardBadge: {
    backgroundColor: '#F4F4F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27272A',
  },
  cardProfit: {
    backgroundColor: '#27272A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1AA',
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  profitPositive: {
    color: '#10B981',
  },
  profitNegative: {
    color: '#EF4444',
  },
  avgSaleContainer: {
    alignItems: 'flex-end',
  },
  avgSaleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A1A1AA',
    marginBottom: 4,
  },
  avgSaleValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 16,
  },
  chartContainer: {
    gap: 12,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingHorizontal: 4,
  },
  chartBarGroup: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  chartBar: {
    width: 14,
    borderRadius: 4,
    backgroundColor: '#10B981',
    minHeight: 2,
  },
  chartBarExpense: {
    backgroundColor: '#EF4444',
  },
  chartDayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#27272A',
  },
  chartDayLabelToday: {
    color: '#6366F1',
    fontWeight: '700',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#27272A',
  },
  topProductsList: {
    gap: 12,
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  topProductRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
    width: 28,
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  topProductMeta: {
    fontSize: 12,
    color: '#27272A',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    paddingVertical: 20,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  alertIcon: {
    fontSize: 28,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
  },
  alertSection: {
    marginBottom: 16,
  },
  alertSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  alertItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#18181B',
    flex: 1,
  },
  alertItemValue: {
    fontSize: 14,
    color: '#27272A',
  },
  alertCloseButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  alertCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
