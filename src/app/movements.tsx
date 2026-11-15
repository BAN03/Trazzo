'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import { BottomTabBar } from '../components/BottomTabBar';
import React, { useEffect, useState, useCallback } from 'react';
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
  formatDateKeyDayMonth,
  formatMonthLabel,
  getMonthBounds,
} from '../utils/date';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  cobrada: 'Cobrada',
  pendiente: 'Pendiente',
  devuelta: 'Devuelta',
};

const STATUS_COLORS: Record<string, string> = {
  cobrada: '#10B981',
  pendiente: '#F59E0B',
  devuelta: '#EF4444',
};

export default function MovementsScreen() {
  const user = useAuthStore((state) => state.user);
  const db = useDatabase();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');
  const [sales, setSales] = useState<{
    id: string;
    date: string;
    total_amount: number;
    total_items: number;
    payment_method: string;
    status: string;
    note?: string;
  }[]>([]);
  const [expenses, setExpenses] = useState<{
    id: string;
    date: string;
    amount: number;
    description: string;
    category: string;
    note?: string;
  }[]>([]);
  const [incomeStats, setIncomeStats] = useState({ total: 0, count: 0 });
  const [expenseStats, setExpenseStats] = useState({ total: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadData = useCallback(async () => {
    if (!userId || !db.initialized) return;

    setLoading(true);

    const monthBounds = getMonthBounds(currentMonth);

    try {
      const [salesData, expenseData, incomeS, expenseS] = await Promise.all([
        Promise.resolve(db.getSales(userId, monthBounds.start, monthBounds.end)),
        Promise.resolve(db.getExpenses(userId, monthBounds.start, monthBounds.end)),
        Promise.resolve(db.getSalesStats(userId, monthBounds.start, monthBounds.end)),
        Promise.resolve(db.getExpensesStats(userId, monthBounds.start, monthBounds.end)),
      ]);

      setSales(salesData);
      setExpenses(expenseData);
      setIncomeStats({ total: incomeS.total_amount, count: incomeS.total_sales });
      setExpenseStats({ total: expenseS.total_amount, count: expenseS.total_expenses });
    } catch (error) {
      console.error('Error loading movements data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentMonth, db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthLabel = capitalize(formatMonthLabel(currentMonth));
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

  const handleEditSale = (saleId: string) => {
    router.push(`/sale/edit/${saleId}`);
  };

  const handleEditExpense = (expenseId: string) => {
    router.push(`/expense/edit/${expenseId}`);
  };

  const handleDeleteSale = (saleId: string) => {
    Alert.alert(
      'Eliminar venta',
      '¿Estás seguro de que quieres eliminar esta venta? Se restaurará el stock de los productos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          db.deleteSale(saleId);
          loadData();
        }},
      ]
    );
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Eliminar gasto',
      '¿Estás seguro de que quieres eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          db.deleteExpense(expenseId);
          loadData();
        }},
      ]
    );
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Movimientos</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={[styles.monthNavButton, !canGoBack && styles.monthNavButtonDisabled]}
            onPress={() => handleMonthChange('prev')}
            disabled={!canGoBack}
            accessibilityLabel="Mes anterior"
          >
            <Text style={[styles.monthNavIcon, !canGoBack && styles.monthNavIconDisabled]}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{monthLabel}</Text>

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

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'sales' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('sales')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'sales' && styles.tabButtonTextActive,
            ]}>
              Ventas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'expenses' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('expenses')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'expenses' && styles.tabButtonTextActive,
            ]}>
              Gastos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {activeTab === 'sales' ? (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total vendido</Text>
                <Text style={styles.statValueIncome}>{currencyFormatter.format(incomeStats.total)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Número de ventas</Text>
                <Text style={styles.statValue}>{incomeStats.count}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total gastado</Text>
                <Text style={styles.statValueExpense}>{currencyFormatter.format(expenseStats.total)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Número de registros</Text>
                <Text style={styles.statValue}>{expenseStats.count}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => activeTab === 'sales'
            ? router.push('/sale/new')
            : router.push('/expense/new')}
        >
          <Text style={styles.addButtonText}>
            + Agregar nueva {activeTab === 'sales' ? 'venta' : 'gasto'}
          </Text>
        </TouchableOpacity>

        {/* List */}
        {activeTab === 'sales' ? (
          sales.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay ventas este mes</Text>
              <Text style={styles.emptySubtext}>Presiona "Agregar nueva venta" para empezar</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {sales.map((sale) => (
                <TouchableOpacity
                  key={sale.id}
                  style={styles.listItem}
                  onPress={() => handleEditSale(sale.id)}
                  onLongPress={() => handleDeleteSale(sale.id)}
                  delayLongPress={400}
                  accessibilityHint="Mantén presionado para eliminar la venta"
                >
                  <View style={styles.listItemLeft}>
                    <Text style={styles.listItemDate}>{formatDateKeyDayMonth(sale.date)}</Text>
                    <View style={styles.listItemMeta}>
                      <Text style={styles.listItemPayment}>
                        {PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_COLORS[sale.status] || '#6366F1' },
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {STATUS_LABELS[sale.status] || sale.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemAmount}>
                      {currencyFormatter.format(sale.total_amount)}
                    </Text>
                    <Text style={styles.listItemCount}>
                      {sale.total_items} art.
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay gastos este mes</Text>
              <Text style={styles.emptySubtext}>Presiona "Agregar nuevo gasto" para empezar</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {expenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.listItem}
                  onPress={() => handleEditExpense(expense.id)}
                  onLongPress={() => handleDeleteExpense(expense.id)}
                  delayLongPress={400}
                  accessibilityHint="Mantén presionado para eliminar el gasto"
                >
                  <View style={styles.listItemLeft}>
                    <Text style={styles.listItemDate}>
                      {formatDateKeyDayMonth(expense.date)}
                    </Text>
                    <View style={styles.listItemMeta}>
                      <Text style={styles.listItemDescription}>{expense.description}</Text>
                      <Text style={styles.listItemCategory}>
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemAmountExpense}>
                      {currencyFormatter.format(expense.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}
      </ScrollView>

      <BottomTabBar active="movements" />
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
  title: {
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
    minWidth: 140,
    textAlign: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27272A',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  statsCard: {
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181B',
  },
  statValueIncome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  statValueExpense: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
  },
  addButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  listItemPayment: {
    fontSize: 13,
    fontWeight: '500',
    color: '#27272A',
  },
  listItemDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#27272A',
  },
  listItemCategory: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  listItemAmountExpense: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 2,
  },
  listItemCount: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#27272A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
});