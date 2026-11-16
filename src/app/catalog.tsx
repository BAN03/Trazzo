'use client';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';
import { useTheme } from '../hooks/useTheme';
import { BottomTabBar } from '../components/BottomTabBar';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { formatQuantity, sanitizeDecimal } from '../utils/numbers';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

export default function CatalogScreen() {
  const user = useAuthStore((state) => state.user);
  const db = useDatabase();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<'products' | 'supplies'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<{
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
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [purchaseTarget, setPurchaseTarget] = useState<{
    id: string;
    name: string;
    unit: string;
  } | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('1');
  const [purchaseError, setPurchaseError] = useState('');

  const userId = user?.id;
  const currentType = activeTab === 'products' ? 'product' : 'supply';

  const loadData = useCallback(async () => {
    if (!userId || !db.initialized) return;

    setLoading(true);
    try {
      const all = db.getProducts(userId);
      setProducts(all.filter((item) => item.type === currentType));

      // Valor total del inventario: productos a precio de venta e insumos a costo.
      const productValue = all
        .filter((item) => item.type === 'product')
        .reduce((sum, item) => sum + item.sale_price * item.stock, 0);
      const supplyValue = all
        .filter((item) => item.type === 'supply')
        .reduce((sum, item) => sum + item.cost_price * item.stock, 0);
      setInventoryValue(productValue + supplyValue);

      const low = all.filter(
        (item) => item.stock <= item.min_stock && item.min_stock > 0
      ).length;
      setLowStockCount(low);
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentType, db]);

  useEffect(() => {
    loadData();
    setSearchQuery('');
  }, [activeTab, loadData]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const openPurchaseModal = (product: { id: string; name: string; unit: string }) => {
    setPurchaseTarget(product);
    setPurchaseQuantity('1');
    setPurchaseError('');
  };

  const closePurchaseModal = () => {
    setPurchaseTarget(null);
    setPurchaseError('');
  };

  const confirmPurchase = () => {
    if (!purchaseTarget) return;
    const clean = sanitizeDecimal(purchaseQuantity);
    const quantity = Number(clean);

    if (!clean || !Number.isFinite(quantity) || quantity <= 0) {
      setPurchaseError('Ingresa una cantidad mayor a 0');
      return;
    }

    db.updateProductStock(purchaseTarget.id, quantity);
    closePurchaseModal();
    loadData();
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (db.productHasSales(productId)) {
      Alert.alert(
        'No se puede eliminar',
        `"${productName}" tiene ventas registradas y borrarlo alteraría tu historial. Puedes editarlo y dejar su stock en 0.`
      );
      return;
    }

    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              db.deleteProduct(productId);
              loadData();
            } catch (error) {
              console.error('Error al eliminar el producto:', error);
              Alert.alert(
                'No se pudo eliminar',
                'El artículo tiene información relacionada. Intenta de nuevo.'
              );
            }
          },
        },
      ]
    );
  };

  if (!db.initialized || loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Catálogo</Text>
            <Text style={styles.subtitle}>Productos e insumos</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valor de inventario</Text>
              <Text style={styles.summaryValue}>{currencyFormatter.format(inventoryValue)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Stock bajo</Text>
              <Text
                style={[styles.summaryValue, lowStockCount > 0 && styles.summaryValueWarning]}
              >
                {lowStockCount} {lowStockCount === 1 ? 'artículo' : 'artículos'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'products' && styles.tabButtonActive]}
            onPress={() => setActiveTab('products')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'products' && styles.tabButtonTextActive]}
            >
              Productos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'supplies' && styles.tabButtonActive]}
            onPress={() => setActiveTab('supplies')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'supplies' && styles.tabButtonTextActive]}
            >
              Insumos
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o categoría..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A1A1AA"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(activeTab === 'products' ? '/product/new' : '/supply/new')}
        >
          <Text style={styles.addButtonText}>
            + Agregar {activeTab === 'products' ? 'producto' : 'insumo'}
          </Text>
        </TouchableOpacity>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Sin resultados'
                : `No hay ${activeTab === 'products' ? 'productos' : 'insumos'} registrados`}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Prueba con otro nombre o categoría'
                : `Presiona "Agregar ${activeTab === 'products' ? 'producto' : 'insumo'}" para empezar`}
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
                onLongPress={() => handleDeleteProduct(product.id, product.name)}
                delayLongPress={500}
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
                      Stock: {formatQuantity(product.stock)} {product.unit}
                    </Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  {activeTab === 'supplies' && (
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openPurchaseModal(product);
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

      <BottomTabBar active="catalog" />

      <Modal
        visible={purchaseTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={closePurchaseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Comprar {purchaseTarget?.name}</Text>
            <Text style={styles.modalSubtitle}>
              Cantidad de {purchaseTarget?.unit} a agregar al stock
            </Text>
            <TextInput
              style={styles.modalInput}
              value={purchaseQuantity}
              onChangeText={(value) => {
                setPurchaseQuantity(sanitizeDecimal(value));
                if (purchaseError) setPurchaseError('');
              }}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor="#A1A1AA"
              autoFocus
              selectTextOnFocus
              maxLength={12}
            />
            {purchaseError ? <Text style={styles.modalError}>{purchaseError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={closePurchaseModal}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmPurchase}>
                <Text style={styles.modalConfirmText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#71717A',
    marginTop: 4,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
  },
  modalError: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27272A',
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});