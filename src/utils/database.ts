import * as SQLite from 'expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('trazzo.db');

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  business_name?: string;
  business_type?: string;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  date: string;
  total_amount: number;
  total_items: number;
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  status: 'cobrada' | 'pendiente' | 'devuelta';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cost_price: number;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  description: string;
  category: 'renta' | 'servicios' | 'insumos' | 'salario' | 'otros';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

export const initDatabase = () => {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      photo TEXT,
      business_name TEXT,
      business_type TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sale_price REAL NOT NULL CHECK(sale_price >= 0),
      cost_price REAL NOT NULL CHECK(cost_price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      min_stock INTEGER NOT NULL DEFAULT 0 CHECK(min_stock >= 0),
      unit TEXT NOT NULL,
      expires INTEGER NOT NULL DEFAULT 0,
      expiry_date TEXT,
      type TEXT NOT NULL CHECK(type IN ('product', 'supply')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      total_amount REAL NOT NULL CHECK(total_amount >= 0),
      total_items INTEGER NOT NULL CHECK(total_items >= 0),
      payment_method TEXT NOT NULL CHECK(payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
      status TEXT NOT NULL CHECK(status IN ('cobrada', 'pendiente', 'devuelta')) DEFAULT 'cobrada',
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_price REAL NOT NULL CHECK(unit_price >= 0),
      total_price REAL NOT NULL CHECK(total_price >= 0),
      cost_price REAL NOT NULL CHECK(cost_price >= 0),
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 0),
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('renta', 'servicios', 'insumos', 'salario', 'otros')),
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  `);
};

export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

export const formatDateForDB = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const formatDateTimeForDB = (date: Date) => {
  return date.toISOString();
};

export default db;