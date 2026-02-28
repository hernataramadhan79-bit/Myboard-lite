
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER';
  items: CartItem[];
}

export interface StockMutation {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'RETURN' | 'NEW' | 'DELETE' | 'SALE';
  amount: number;
  note?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  timestamp: string;
  isRead: boolean;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  address: string;
  cashierName: string;
  taxRate: number; // Percentage value (e.g., 10 for 10%)
}

export type ViewState = 'dashboard' | 'pos' | 'inventory' | 'reports' | 'settings';
