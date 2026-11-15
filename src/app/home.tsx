'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import React, { useEffect, useState, useMemo } from 'react';
import * as Localization from 'expo-localization';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
});

const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

const getWeekBounds = (date: Date) => {
  const day = date.getDay(); // 0 = Sunday
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const formatDateForDB = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const db = useDatabase();
  const params = useLocalSearchParams();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [income, setIncome] = useState({ total: 0, count: 0 });
  const [expenses, setExpenses] = useState({ total: 0, count: 0 });
  const [profit, setProfit] = useState(0);
  const [avgSale, setAvgSale] = useState(0);
  const [topProducts, setTopProducts] = useState<Array<{
    product_name: string;
    total_quantity: number;
    total_profit: number;
  }>>([]);
  const [weeklyData, setWeeklyData] = useState<Array<{
    date: string;
    income: number;
    expense: number;
  }>>([]);
  const [lowStockAlert, setLowStockAlert] = useState<{ name: string; stock: number }[]>([]);
  const [expiringAlert, setExpiringAlert] = useState<{ name: string; expiry_date: string }[]>([]);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadData = useCallback(async () => {
    if (!userId || !db.initialized) return;

    setLoading(true);

    const monthStart = formatDateForDB(getMonthBounds(currentMonth).start);
    const monthEnd = formatDateForDB(getMonthBounds(currentMonth).end);
    const weekStart = formatDateForDB(getWeekBounds(currentMonth).start);
    const weekEnd = formatDateForDB(getWeekBounds(currentMonth).end);

    try {
      const [incomeStats, expenseStats, topProds, weekly, lowStock, expiring] = await Promise.all([
        Promise.resolve(db.getSalesStats(userId, monthStart, monthEnd)),
        Promise.resolve(db.getExpensesStats(userId, monthStart, monthEnd)),
        Promise.resolve(db.getTopProducts(userId, monthStart, monthEnd, 4)),
        Promise.resolve(db.getWeeklySalesData(userId, weekStart, weekEnd)),
        Promise.resolve(db.getLowStockProducts(userId)),
        Promise.resolve(db.getExpiringProducts(userId, 7)),
      ]);

      setIncome({ total: incomeStats.total_amount, count: incomeStats.total_sales });
      setExpenses({ total: expenseStats.total_amount, count: expenseStats.total_expenses });
      setProfit(incomeStats.total_amount - expenseStats.total_amount);
      setAvgSale(incomeStats.avg_sale);
      setTopProducts(topProds);
      setWeeklyData(weekly);
      setLowStockAlert(lowStock.map(p => ({ name: p.name, stock: p.stock })));
      setExpiringAlert(expiring.map(p => ({ name: p.name, expiry_date: p.expiry_date || '' })));
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentMonth, db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const hasAlerts = lowStockAlert.length > 0 || expiringAlert.length > 0;
    if (hasAlerts && !showAlertPopup) {
      setShowAlertPopup(true);
    }
  }, [lowStockAlert, expiringAlert, showAlertPopup]);

  const monthLabel = dateFormatter.format(currentMonth);
  const canGoBack = () => {
    const now = new Date();
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth.getMonth() === now.getMonth() - 1 || prevMonth.getFullYear() === now.getFullYear() - 1;
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
      if (canGoBack()) {
        setCurrentMonth(newMonth);
      }
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
      const now = new Date();
      if (newMonth.getMonth() === now.getMonth() && newMonth.getFullYear() === now.getFullYear()) {
        setCurrentMonth(newMonth);
      }
    }
  };

  const handleCloseAlert = () => {
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
        <AlertPopup
          lowStock={lowStockAlert}
          expiring={expiringAlert}
          onClose={handleCloseAlert}
        />
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hola, {user?.name || 'Usuario'}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => handleMonthChange('prev')}
            disabled={!canGoBack()}
          >
            <Text style={[
              styles.monthNavIcon,
              !canGoBack() && styles.monthNavIconDisabled,
            ]}>
              ‹
            </Text>
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{monthLabel}</Text>

          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => handleMonthChange('next')}
            disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
          >
            <Text style={[
              styles.monthNavIcon,
              currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()
                && styles.monthNavIconDisabled,
            ]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Income Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Ingresos este mes</Text>
              <Text style={styles.cardValueIncome}>{currencyFormatter.format(income.total)}</Text>
            </View>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{income.count} ventas</Text>
            </View>
          </View>
        </View>

        {/* Expense Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Egresos este mes</Text>
              <Text style={styles.cardValueExpense}>{currencyFormatter.format(expenses.total)}</Text>
            </View>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{expenses.count} registros</Text>
            </View>
          </View>
        </View>

        {/* Profit Card */}
        <View style={styles.cardProfit}>
          <View style={styles.profitRow}>
            <View>
              <Text style={styles.profitLabel}>Ganancia neta</Text>
              <Text style={[
                styles.profitValue,
                profit >= 0 ? styles.profitPositive : styles.profitNegative,
              ]}>
                {currencyFormatter.format(profit)}
              </Text>
            </View>
            <View style={styles.avgSaleContainer}>
              <Text style={styles.avgSaleLabel}>Venta promedio</Text>
              <Text style={styles.avgSaleValue}>{currencyFormatter.format(avgSale)}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ventas vs Gastos de esta semana</Text>
          <WeeklyChart data={weeklyData} />
        </View>

        {/* Top Products */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos más vendidos</Text>
          </View>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyText}>No hay ventas este mes</Text>
          ) : (
            <View style={styles.topProductsList}>
              {topProducts.map((product, index) => (
                <View key={product.product_name} style={styles.topProductRow}>
                  <Text style={styles.topProductRank}>#{index + 1}</Text>
                  <View style={styles.topProductInfo}>
                    <Text style={styles.topProductName}>{product.product_name}</Text>
                    <Text style={styles.topProductMeta}>
                      {product.total_quantity} vendidos • {currencyFormatter.format(product.total_profit)} ganancia
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItemActive} onPress={() => router.replace('/home')}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabelActive}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/movements')}>
          <Text style={styles.tabIcon}>💰</Text>
          <Text style={styles.tabLabel}>Movimientos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/catalog')}>
          <Text style={styles.tabIcon}>📦</Text>
          <Text style={styles.tabLabel}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/tasks')}>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabel}>Tareas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/reports')}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabLabel}>Informes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Alert Popup Component
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
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertItemName}>{item.name}</Text>
                <Text style={styles.alertItemValue}>{item.stock} unidades</Text>
              </View>
            ))}
          </View>
        )}

        {expiring.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.alertSectionTitle}>Próximos a caducar</Text>
            {expiring.map((item, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertItemName}>{item.name}</Text>
                <Text style={styles.alertItemValue}>Caduca: {item.expiry_date}</Text>
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

// Weekly Chart Component
function WeeklyChart({ data }: { data: Array<{ date: string; income: number; expense: number }> }) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expense)),
    1
  );

  const chartData = days.map((day, index) => {
    const dayData = data.find(d => {
      const date = new Date(d.date);
      return date.getDay() === index;
    });
    return {
      day,
      income: dayData?.income || 0,
      expense: dayData?.expense || 0,
    };
  });

  const maxIncome = Math.max(...chartData.map(d => d.income), 1);
  const maxExpense = Math.max(...chartData.map(d => d.expense), 1);
  const overallMax = Math.max(maxIncome, maxExpense);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.chartBarGroup}>
            <View style={styles.chartBarsWrapper}>
              <View style={[
                styles.chartBar,
                { height: overallMax > 0 ? (item.income / overallMax) * 150 : 0 },
              ]} />
              <View style={[
                styles.chartBar,
                { height: overallMax > 0 ? (item.expense / overallMax) * 150 : 0 },
                styles.chartBarExpense,
              ]} />
            </View>
            <Text style={styles.chartDayLabel}>{item.day}</Text>
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
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#18181B',
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
    minWidth: 140,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartContainer: {
    gap: 12,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingHorizontal: 8,
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
    width: 16,
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
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabItemActive: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  tabLabelActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  // Alert styles
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  alertItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#18181B',
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