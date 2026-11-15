'use client';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const UNITS = ['pz', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'unidad', 'paquete', 'caja'];

export default function CatalogScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const db = useDatabase();
  const params = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<'products' | 'supplies'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    category: string;
    sale_price: number;
    cost_price: number;
    stock: number;
    min_stock: number;
    unit: string;
    expires: number;
    expiry_date?: string;
    type: 'product' | 'supply';
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const userId = user?.id;
  const currentType = activeTab === 'products' ? 'product' : 'supply';

  const loadData = useCallback(async () => {
    if (!userId || !db.initialized) return;

    setLoading(true);
    try {
      const data = db.getProducts(userId, currentType);
      setProducts(data);

      // Calculate inventory value
      const value = data.reduce((sum, p) => sum + (p.sale_price * p.stock), 0);
      setInventoryValue(value);

      // Count low stock
      const low = data.filter(p => p.stock <= p.min_stock && p.min_stock > 0).length;
      setLowStockCount(low);
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentType, db.initialized]);

  useEffect(() => {
    loadData();
    setSearchQuery('');
  }, [activeTab, loadData]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleBuySupply = (supplyId: string) => {
    const supply = products.find(p => p.id === supplyId);
    if (!supply) return;

    Alert.prompt(
      `Comprar ${supply.name}`,
      `Ingresa la cantidad de ${supply.unit} a agregar al stock:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agregar',
          onPress: (value: string) => {
            const qty = parseInt(value);
            if (!qty || qty <= 0) {
              Alert.alert('Error', 'La cantidad debe ser mayor a 0');
              return;
            }
            db.updateProductStock(supplyId, qty);
            loadData();
          },
        },
      ],
      'plain-text',
      '1',
      'numeric'
    );
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          db.deleteProduct(productId);
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
            <Text style={styles.title}>Catálogo</Text>
            <Text style={styles.subtitle}>Productos e insumos</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valor de inventario</Text>
              <Text style={styles.summaryValue}>{currencyFormatter.format(inventoryValue)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Stock bajo</Text>
              <Text style={[
                styles.summaryValue,
                lowStockCount > 0 && styles.summaryValueWarning,
              ]}>
                {lowStockCount} {lowStockCount === 1 ? 'artículo' : 'artículos'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'products' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'products' && styles.tabButtonTextActive,
            ]}>
              Productos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'supplies' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('supplies')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'supplies' && styles.tabButtonTextActive,
            ]}>
              Insumos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto/insumo..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A1A1AA"
        />

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(activeTab === 'products' ? '/product/new' : '/supply/new')}
        >
          <Text style={styles.addButtonText}>
            + Agregar {activeTab === 'products' ? 'producto' : 'insumo'}
          </Text>
        </TouchableOpacity>

        {/* List */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              No hay {activeTab === 'products' ? 'productos' : 'insumos'} registrados
            </Text>
            <Text style={styles.emptySubtext}>
              Presiona "Agregar {activeTab === 'products' ? 'producto' : 'insumo'}" para empezar
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredProducts.map(product => (
              <TouchableOpacity
                key={product.id}
                style={styles.listItem}
                onPress={() => router.push(
                  activeTab === 'products'
                    ? `/product/edit/${product.id}`
                    : `/supply/edit/${product.id}`
                )}
              >
                <View style={styles.listItemLeft}>
                  <Text style={styles.listItemName}>{product.name}</Text>
                  <View style={styles.listItemMeta}>
                    <Text style={styles.listItemCategory}>{product.category}</Text>
                    <Text style={styles.listItemPrice}>
                      {currencyFormatter.format(
                        activeTab === 'products' ? product.sale_price : product.cost_price
                      )} / {product.unit}
                    </Text>
                    <Text style={[
                      styles.listItemStock,
                      product.stock <= product.min_stock && product.min_stock > 0 && styles.listItemStockLow,
                    ]}>
                      Stock: {product.stock} {product.unit}
                    </Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  {activeTab === 'supplies' && (
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleBuySupply(product.id);
                      }}
                    >
                      <Text style={styles.buyButtonText}>Comprar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/home')}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/movements')}>
          <Text style={styles.tabIcon}>💰</Text>
          <Text style={styles.tabLabel}>Movimientos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItemActive} onPress={() => router.replace('/catalog')}>
          <Text style={styles.tabIcon}>📦</Text>
          <Text style={styles.tabLabelActive}>Catálogo</Text>
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
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
  },
  summaryValueWarning: {
    color: '#EF4444',
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
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listItemCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  listItemPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: '#27272A',
  },
  listItemStock: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  listItemStockLow: {
    color: '#EF4444',
    fontWeight: '600',
  },
  listItemRight: {
    marginLeft: 12,
  },
  buyButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
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
});