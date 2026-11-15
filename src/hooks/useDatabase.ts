import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from './useAuthStore';
import db, {
  initDatabase,
  generateId,
  getCurrentDateTime,
  formatDateForDB,
  upsertUser as upsertUserRow,
  mergeLocalUserInto,
  UserUpsertInput,
  User,
  Product,
  Sale,
  SaleItem,
  Expense,
  Task,
} from '../utils/database';
import { todayKey } from '../utils/date';

const authUserToRow = (user: {
  id: string;
  name: string;
  email: string;
  photo?: string;
  businessName?: string;
  businessType?: string;
  onboardingCompleted: boolean;
}): UserUpsertInput => ({
  id: user.id,
  name: user.name,
  email: user.email,
  photo: user.photo ?? null,
  business_name: user.businessName ?? null,
  business_type: user.businessType ?? null,
  onboarding_completed: user.onboardingCompleted,
});

export function useDatabase() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initDatabase();

    // Si el usuario ya estaba guardado en AsyncStorage, nos aseguramos de
    // que exista en SQLite antes de que las pantallas consulten datos.
    const authUser = useAuthStore.getState().user;
    if (authUser) {
      upsertUserRow(authUserToRow(authUser));
    }

    setInitialized(true);
  }, []);

  const ensureUser = useCallback((user: UserUpsertInput) => {
    initDatabase();
    upsertUserRow(user);
  }, []);

  const ensureAuthUser = useCallback((user: Parameters<typeof authUserToRow>[0]) => {
    initDatabase();
    upsertUserRow(authUserToRow(user));
  }, []);

  const migrateLocalData = useCallback((targetUserId: string) => {
    initDatabase();
    mergeLocalUserInto(targetUserId);
  }, []);

  // User operations
  const createUser = useCallback((user: Omit<User, 'created_at' | 'updated_at'>) => {
    upsertUserRow({
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      business_name: user.business_name,
      business_type: user.business_type,
      onboarding_completed: user.onboarding_completed,
    });
  }, []);

  const getUser = useCallback((id: string): User | null => {
    const result = db.getFirstSync<User>('SELECT * FROM users WHERE id = ?', [id]);
    return result || null;
  }, []);

  const getCurrentUser = useCallback((): User | null => {
    const result = db.getFirstSync<User>('SELECT * FROM users ORDER BY created_at DESC LIMIT 1');
    return result || null;
  }, []);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    const existing = db.getFirstSync<User>('SELECT * FROM users WHERE id = ?', [id]);

    if (!existing) {
      // Antes esto no hacía nada y dejaba la app sin usuario en SQLite.
      upsertUserRow({
        id,
        name: data.name || 'Usuario',
        email: data.email || `${id}@trazzo.app`,
        photo: data.photo,
        business_name: data.business_name,
        business_type: data.business_type,
        onboarding_completed: data.onboarding_completed ?? 0,
      });
      return;
    }

    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f as keyof User] ?? null);
    values.push(getCurrentDateTime(), id);

    db.runSync(
      `UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );
  }, []);

  // Product operations
  const createProduct = useCallback((product: Omit<Product, 'created_at' | 'updated_at'>) => {
    const now = getCurrentDateTime();
    db.runSync(
      `INSERT INTO products (id, user_id, name, category, sale_price, cost_price, stock, min_stock, unit, expires, expiry_date, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.user_id,
        product.name,
        product.category,
        product.sale_price,
        product.cost_price,
        product.stock,
        product.min_stock,
        product.unit,
        product.expires ? 1 : 0,
        product.expiry_date || null,
        product.type,
        now,
        now,
      ]
    );
  }, []);

  const getProducts = useCallback((userId: string, type?: 'product' | 'supply'): Product[] => {
    let query = 'SELECT * FROM products WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY name ASC';
    return db.getAllSync<Product>(query, params);
  }, []);

  const getProduct = useCallback((id: string): Product | null => {
    const result = db.getFirstSync<Product>('SELECT * FROM products WHERE id = ?', [id]);
    return result || null;
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<Product>) => {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'user_id');
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const val = data[f as keyof Product];
      if (f === 'expires') return val ? 1 : 0;
      return val ?? null;
    });
    values.push(getCurrentDateTime(), id);

    db.runSync(
      `UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    db.runSync('DELETE FROM products WHERE id = ?', [id]);
  }, []);

  const updateProductStock = useCallback((productId: string, quantityChange: number) => {
    db.runSync(
      `UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?`,
      [quantityChange, getCurrentDateTime(), productId]
    );
  }, []);

  const getLowStockProducts = useCallback((userId: string): Product[] => {
    return db.getAllSync<Product>(
      `SELECT * FROM products WHERE user_id = ? AND stock <= min_stock AND min_stock > 0`,
      [userId]
    );
  }, []);

  const getExpiringProducts = useCallback((userId: string, days: number = 7): Product[] => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = formatDateForDB(futureDate);

    return db.getAllSync<Product>(
      `SELECT * FROM products WHERE user_id = ? AND expires = 1 AND expiry_date <= ? AND expiry_date >= ?`,
      [userId, futureDateStr, todayKey()]
    );
  }, []);

  // Sales operations
  const createSale = useCallback((
    sale: Omit<Sale, 'created_at' | 'updated_at'>,
    items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]
  ) => {
    const now = getCurrentDateTime();

    // Use transaction for atomicity
    db.execSync('BEGIN TRANSACTION');
    try {
      db.runSync(
        `INSERT INTO sales (id, user_id, date, total_amount, total_items, payment_method, status, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sale.id,
          sale.user_id,
          sale.date,
          sale.total_amount,
          sale.total_items,
          sale.payment_method,
          sale.status,
          sale.note || null,
          now,
          now,
        ]
      );

      for (const item of items) {
        const itemId = generateId();
        db.runSync(
          `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total_price, cost_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            sale.id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.cost_price,
          ]
        );

        // Update product stock
        db.runSync(
          `UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?`,
          [item.quantity, now, item.product_id]
        );
      }

      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  }, []);

  const getSales = useCallback((userId: string, startDate?: string, endDate?: string): Sale[] => {
    let query = 'SELECT * FROM sales WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    return db.getAllSync<Sale>(query, params);
  }, []);

  const getSale = useCallback((id: string): Sale | null => {
    const result = db.getFirstSync<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
    return result || null;
  }, []);

  const getSaleItems = useCallback((saleId: string): SaleItem[] => {
    return db.getAllSync<SaleItem>(
      'SELECT * FROM sale_items WHERE sale_id = ?',
      [saleId]
    );
  }, []);

  const updateSale = useCallback((id: string, data: Partial<Sale>) => {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'user_id');
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f as keyof Sale] ?? null);
    values.push(getCurrentDateTime(), id);

    db.runSync(
      `UPDATE sales SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );
  }, []);

  const deleteSale = useCallback((id: string) => {
    // First restore stock for sale items
    const items = db.getAllSync<SaleItem>('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?', [id]);
    const now = getCurrentDateTime();

    db.execSync('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        db.runSync(
          `UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?`,
          [item.quantity, now, item.product_id]
        );
      }
      db.runSync('DELETE FROM sale_items WHERE sale_id = ?', [id]);
      db.runSync('DELETE FROM sales WHERE id = ?', [id]);
      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  }, []);

  /**
   * Actualiza una venta y sus artículos en una sola transacción:
   * devuelve el stock anterior y descuenta el nuevo. Evita el flujo
   * destructivo de borrar y volver a crear.
   */
  const updateSaleWithItems = useCallback((
    id: string,
    data: Partial<Pick<Sale, 'date' | 'total_amount' | 'total_items' | 'payment_method' | 'status' | 'note'>>,
    items: Omit<SaleItem, 'id' | 'sale_id'>[]
  ) => {
    const now = getCurrentDateTime();
    const oldItems = db.getAllSync<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', [id]);

    db.execSync('BEGIN TRANSACTION');
    try {
      for (const item of oldItems) {
        db.runSync(
          `UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?`,
          [item.quantity, now, item.product_id]
        );
      }

      db.runSync('DELETE FROM sale_items WHERE sale_id = ?', [id]);

      db.runSync(
        `UPDATE sales SET date = ?, total_amount = ?, total_items = ?, payment_method = ?, status = ?, note = ?, updated_at = ?
         WHERE id = ?`,
        [
          data.date ?? '',
          data.total_amount ?? 0,
          data.total_items ?? 0,
          data.payment_method ?? 'efectivo',
          data.status ?? 'cobrada',
          data.note ?? null,
          now,
          id,
        ]
      );

      for (const item of items) {
        db.runSync(
          `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total_price, cost_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateId(),
            id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.cost_price,
          ]
        );

        db.runSync(
          `UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?`,
          [item.quantity, now, item.product_id]
        );
      }

      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  }, []);

  const getSalesStats = useCallback((userId: string, startDate: string, endDate: string) => {
    const result = db.getFirstSync<{
      total_sales: number;
      total_amount: number;
      avg_sale: number;
    }>(
      `SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(AVG(total_amount), 0) as avg_sale
       FROM sales
       WHERE user_id = ? AND date >= ? AND date <= ? AND status = 'cobrada'`,
      [userId, startDate, endDate]
    );
    return result || { total_sales: 0, total_amount: 0, avg_sale: 0 };
  }, []);

  const getTopProducts = useCallback((userId: string, startDate: string, endDate: string, limit: number = 4) => {
    return db.getAllSync<{
      product_id: string;
      product_name: string;
      total_quantity: number;
      total_revenue: number;
      total_profit: number;
    }>(
      `SELECT
        si.product_id,
        si.product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_revenue,
        SUM((si.unit_price - si.cost_price) * si.quantity) as total_profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.user_id = ? AND s.date >= ? AND s.date <= ? AND s.status = 'cobrada'
       GROUP BY si.product_id, si.product_name
       ORDER BY total_quantity DESC
       LIMIT ?`,
      [userId, startDate, endDate, limit]
    );
  }, []);

  const getWeeklySalesData = useCallback((userId: string, weekStart: string, weekEnd: string) => {
    return db.getAllSync<{
      date: string;
      income: number;
      expense: number;
    }>(
      `SELECT
        date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expense
       FROM (
        SELECT date, total_amount as amount, 'income' as type FROM sales WHERE user_id = ? AND status = 'cobrada'
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expenses WHERE user_id = ?
       )
       WHERE date >= ? AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [userId, userId, weekStart, weekEnd]
    );
  }, []);

  // Expense operations
  const createExpense = useCallback((expense: Omit<Expense, 'created_at' | 'updated_at'>) => {
    const now = getCurrentDateTime();
    db.runSync(
      `INSERT INTO expenses (id, user_id, date, amount, description, category, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.user_id,
        expense.date,
        expense.amount,
        expense.description,
        expense.category,
        expense.note || null,
        now,
        now,
      ]
    );
  }, []);

  const getExpenses = useCallback((userId: string, startDate?: string, endDate?: string): Expense[] => {
    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    return db.getAllSync<Expense>(query, params);
  }, []);

  const getExpense = useCallback((id: string): Expense | null => {
    const result = db.getFirstSync<Expense>('SELECT * FROM expenses WHERE id = ?', [id]);
    return result || null;
  }, []);

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'user_id');
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f as keyof Expense] ?? null);
    values.push(getCurrentDateTime(), id);

    db.runSync(
      `UPDATE expenses SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
  }, []);

  const getExpensesStats = useCallback((userId: string, startDate: string, endDate: string) => {
    const result = db.getFirstSync<{
      total_expenses: number;
      total_amount: number;
    }>(
      `SELECT
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount
       FROM expenses
       WHERE user_id = ? AND date >= ? AND date <= ?`,
      [userId, startDate, endDate]
    );
    return result || { total_expenses: 0, total_amount: 0 };
  }, []);

  // Task operations (disabled for now)
  const createTask = useCallback((task: Omit<Task, 'created_at' | 'updated_at'>) => {
    const now = getCurrentDateTime();
    db.runSync(
      `INSERT INTO tasks (id, user_id, title, description, due_date, completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.user_id,
        task.title,
        task.description || null,
        task.due_date || null,
        task.completed ? 1 : 0,
        now,
        now,
      ]
    );
  }, []);

  const getTasks = useCallback((userId: string): Task[] => {
    return db.getAllSync<Task>(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC, created_at DESC',
      [userId]
    );
  }, []);

  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'user_id');
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const val = data[f as keyof Task];
      if (f === 'completed') return val ? 1 : 0;
      return val ?? null;
    });
    values.push(getCurrentDateTime(), id);

    db.runSync(
      `UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
  }, []);

  return useMemo(() => ({
    initialized,
    // Users
    ensureUser,
    ensureAuthUser,
    migrateLocalData,
    createUser,
    getUser,
    getCurrentUser,
    updateUser,
    // Products
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getLowStockProducts,
    getExpiringProducts,
    // Sales
    createSale,
    getSales,
    getSale,
    getSaleItems,
    updateSale,
    updateSaleWithItems,
    deleteSale,
    getSalesStats,
    getTopProducts,
    getWeeklySalesData,
    // Expenses
    createExpense,
    getExpenses,
    getExpense,
    updateExpense,
    deleteExpense,
    getExpensesStats,
    // Tasks (disabled)
    createTask,
    getTasks,
    updateTask,
    deleteTask,
  }), [
    initialized,
    ensureUser,
    ensureAuthUser,
    migrateLocalData,
    createUser,
    getUser,
    getCurrentUser,
    updateUser,
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getLowStockProducts,
    getExpiringProducts,
    createSale,
    getSales,
    getSale,
    getSaleItems,
    updateSale,
    updateSaleWithItems,
    deleteSale,
    getSalesStats,
    getTopProducts,
    getWeeklySalesData,
    createExpense,
    getExpenses,
    getExpense,
    updateExpense,
    deleteExpense,
    getExpensesStats,
    createTask,
    getTasks,
    updateTask,
    deleteTask,
  ]);
}