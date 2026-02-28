import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { Product, Transaction, StoreSettings, StockMutation, AppNotification } from '../types';

const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'MyBoard Lite',
  whatsappNumber: '6281234567890',
  address: 'Jl. Contoh Bisnis No. 123, Jakarta',
  cashierName: 'Kasir',
  taxRate: 0
};

interface AppContextType {
  user: FirebaseUser | null;
  loading: boolean;
  products: Product[];
  transactions: Transaction[];
  stockMutations: StockMutation[];
  notifications: AppNotification[];
  toast: AppNotification | null;
  settings: StoreSettings;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustProductStock: (id: string, amount: number, type: StockMutation['type'], note?: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateSettings: (settings: StoreSettings) => Promise<void>;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  hideToast: () => void;
  resetFactory: () => Promise<void>;
  clearTransactions: () => Promise<void>;
  clearProducts: () => Promise<void>;
  resetSettings: () => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  deleteProducts: (ids: string[]) => Promise<void>;
  importData: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockMutations, setStockMutations] = useState<StockMutation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        // Clear data if logged out
        setProducts([]);
        setTransactions([]);
        setStockMutations([]);
        setUsageCount(0);
      }

    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const productsRef = collection(db, 'products');
    const transRef = collection(db, 'transactions');
    const mutationsRef = collection(db, 'mutations');
    const settingsRef = doc(db, 'config', 'settings');
    const usageRef = doc(db, 'usage', user.uid);

    const unsubProducts = onSnapshot(query(productsRef, orderBy('name')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data() } as Product));
        setProducts(data);
      },
      (error) => {
        console.error("Firestore Products Listener Error:", error);
      }
    );

    const unsubTrans = onSnapshot(query(transRef, orderBy('date', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data() } as Transaction));
        setTransactions(data);
      },
      (error) => {
        console.error("Firestore Transactions Listener Error:", error);
      }
    );

    const unsubMutations = onSnapshot(query(mutationsRef, orderBy('date', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data() } as StockMutation));
        setStockMutations(data);
      },
      (error) => {
        console.error("Firestore Mutations Listener Error:", error);
      }
    );

    const unsubSettings = onSnapshot(settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as StoreSettings);
        } else {
          // Only admin should ideally initialize settings, but for robustness:
          if (!user.isAnonymous) setDoc(settingsRef, INITIAL_SETTINGS);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Settings Listener Error:", error);
        setLoading(false);
      }
    );

    const unsubUsage = onSnapshot(usageRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsageCount(snapshot.data().count || 0);
      } else {
        setDoc(usageRef, { count: 0 });
      }
    });

    return () => {
      unsubProducts();
      unsubTrans();
      unsubMutations();
      unsubSettings();
      unsubUsage();
    };


  }, [user]);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    setToast(newNotif);

    setTimeout(() => {
      setToast(currentToast => currentToast?.id === newNotif.id ? null : currentToast);
    }, 3000);
  }, []);

  const checkAnonymousLimit = useCallback(() => {
    if (user?.isAnonymous) {
      if (usageCount >= 5) {
        addNotification('Batas Demo', 'Anda telah mencapai batas 5 kali aksi untuk akun demo.', 'ERROR');
        return false;
      }
    }
    return true;
  }, [user, usageCount, addNotification]);

  const incrementUsage = useCallback(async () => {
    if (user?.isAnonymous) {
      const usageRef = doc(db, 'usage', user.uid);
      await updateDoc(usageRef, { count: usageCount + 1 });
    }
  }, [user, usageCount]);


  const blockAnonymous = useCallback((actionName: string) => {
    if (user?.isAnonymous) {
      addNotification('Gagal', `${actionName} tidak diizinkan pada akun demo.`, 'ERROR');
      return true;
    }
    return false;
  }, [user, addNotification]);


  const logMutation = useCallback(async (mutation: Omit<StockMutation, 'id' | 'date'>) => {
    if (!user) return;
    const mutationId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newLog: StockMutation = {
      id: mutationId,
      date: new Date().toISOString(),
      ...mutation
    };
    await setDoc(doc(db, 'mutations', mutationId), newLog);
  }, [user]);

  const addProduct = useCallback(async (product: Product) => {
    if (!user) return;
    if (!checkAnonymousLimit()) return;

    await setDoc(doc(db, 'products', product.id), product);
    await logMutation({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'NEW',
      amount: product.stock,
      note: 'Produk baru ditambahkan'
    });
    await incrementUsage();
    addNotification('Produk Baru', `Produk ${product.name} berhasil ditambahkan.`, 'SUCCESS');
  }, [user, logMutation, addNotification, checkAnonymousLimit, incrementUsage]);


  const updateProduct = useCallback(async (updatedProduct: Product) => {
    if (!user) return;
    await updateDoc(doc(db, 'products', updatedProduct.id), { ...updatedProduct });
  }, [user]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user) return;
    if (blockAnonymous('Hapus Produk')) return;

    const product = products.find(p => p.id === id);
    if (!product) return;

    await deleteDoc(doc(db, 'products', id));
    await logMutation({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'DELETE',
      amount: -product.stock,
      note: 'Produk dihapus dari sistem'
    });
    addNotification('Produk Dihapus', `Produk ${product.name} telah dihapus.`, 'ERROR');
  }, [user, products, logMutation, addNotification, blockAnonymous]);


  const adjustProductStock = useCallback(async (id: string, amount: number, type: StockMutation['type'], note?: string) => {
    if (!user) return;
    if (!checkAnonymousLimit()) return;

    const product = products.find(p => p.id === id);
    if (!product) return;

    const newStock = Math.max(0, product.stock + amount);
    await updateDoc(doc(db, 'products', id), { stock: newStock });

    await logMutation({
      productId: id,
      productName: product.name,
      sku: product.sku,
      type: type,
      amount: amount,
      note: note || '-'
    });

    await incrementUsage();

    if (type === 'IN') addNotification('Stok Masuk', `Stok ${product.name} bertambah ${amount}.`, 'INFO');
    if (type === 'OUT') addNotification('Stok Keluar', `Stok ${product.name} berkurang ${Math.abs(amount)}.`, 'WARNING');
    if (newStock <= 5) addNotification('Peringatan Stok', `Stok ${product.name} menipis!`, 'WARNING');
  }, [user, products, logMutation, addNotification, checkAnonymousLimit, incrementUsage]);


  const addTransaction = useCallback(async (transaction: Transaction) => {
    if (!user) return;

    const batch = writeBatch(db);

    // Save transaction
    batch.set(doc(db, 'transactions', transaction.id), transaction);

    // Update stocks and log mutations
    for (const item of transaction.items) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        batch.update(doc(db, 'products', item.id), { stock: newStock });

        const mutationId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        batch.set(doc(db, 'mutations', mutationId), {
          id: mutationId,
          date: new Date().toISOString(),
          productId: item.id,
          productName: item.name,
          sku: item.sku,
          type: 'SALE',
          amount: -item.quantity,
          note: `Transaksi: ${transaction.id}`
        });

        if (newStock <= 5) {
          addNotification('Stok Menipis', `${item.name} sisa ${newStock}!`, 'WARNING');
        }
      }
    }

    await batch.commit();
    addNotification('Transaksi Berhasil', `Total: Rp ${transaction.total.toLocaleString()}`, 'SUCCESS');
  }, [user, products, addNotification]);

  const updateSettings = useCallback(async (newSettings: StoreSettings) => {
    if (!user) return;
    await setDoc(doc(db, 'config', 'settings'), newSettings);
    addNotification('Setelan Disimpan', 'Konfigurasi toko berhasil diperbarui.', 'SUCCESS');
  }, [user, addNotification]);

  const logout = useCallback(async () => {
    await auth.signOut();
  }, []);

  const resetFactory = useCallback(async () => {
    if (!user) return;
    if (blockAnonymous('Reset Factory')) return;
    if (!window.confirm('Hapus SEMUA data di database?')) return;

    const batch = writeBatch(db);
    products.forEach(p => batch.delete(doc(db, 'products', p.id)));
    transactions.forEach(t => batch.delete(doc(db, 'transactions', t.id)));
    stockMutations.forEach(m => batch.delete(doc(db, 'mutations', m.id)));
    batch.set(doc(db, 'config', 'settings'), INITIAL_SETTINGS);

    await batch.commit();
    addNotification('Reset Berhasil', 'Semua data telah dibersihkan.', 'INFO');
  }, [user, products, transactions, stockMutations, addNotification, blockAnonymous]);


  const clearTransactions = useCallback(async () => {
    if (!user) return;
    if (blockAnonymous('Hapus Transaksi')) return;
    const batch = writeBatch(db);
    transactions.forEach(t => batch.delete(doc(db, 'transactions', t.id)));
    await batch.commit();
  }, [user, transactions, blockAnonymous]);


  const clearProducts = useCallback(async () => {
    if (!user) return;
    if (blockAnonymous('Hapus Produk')) return;
    const batch = writeBatch(db);
    products.forEach(p => batch.delete(doc(db, 'products', p.id)));
    await batch.commit();
  }, [user, products, blockAnonymous]);


  const resetSettings = useCallback(async () => {
    if (!user) return;
    await setDoc(doc(db, 'config', 'settings'), INITIAL_SETTINGS);
  }, [user]);

  const deleteTransactions = useCallback(async (ids: string[]) => {
    if (!user) return;
    if (blockAnonymous('Hapus Transaksi')) return;
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'transactions', id)));
    await batch.commit();
  }, [user, blockAnonymous]);


  const deleteProducts = useCallback(async (ids: string[]) => {
    if (!user) return;
    if (blockAnonymous('Hapus Produk')) return;
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'products', id)));
    await batch.commit();
  }, [user, blockAnonymous]);


  const importData = useCallback(async (data: any) => {
    if (!user) return;
    if (blockAnonymous('Impor Data')) return;

    const batch = writeBatch(db);

    if (data.products) data.products.forEach((p: Product) => batch.set(doc(db, 'products', p.id), p));
    if (data.transactions) data.transactions.forEach((t: Transaction) => batch.set(doc(db, 'transactions', t.id), t));
    if (data.stockMutations) data.stockMutations.forEach((m: StockMutation) => batch.set(doc(db, 'mutations', m.id), m));
    if (data.settings) batch.set(doc(db, 'config', 'settings'), data.settings);
    await batch.commit();
    addNotification('Import Berhasil', 'Data berhasil disinkronkan ke database.', 'SUCCESS');
  }, [user, addNotification]);

  const value = useMemo(() => ({
    user,
    loading,
    products,
    transactions,
    stockMutations,
    notifications,
    toast,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustProductStock,
    addTransaction,
    updateSettings,
    markAllNotificationsAsRead: () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))),
    clearNotifications: () => setNotifications([]),
    hideToast: () => setToast(null),
    resetFactory,
    clearTransactions,
    clearProducts,
    resetSettings,
    deleteTransactions,
    deleteProducts,
    importData,
    logout
  }), [
    user, loading, products, transactions, stockMutations, notifications, toast, settings,
    addProduct, updateProduct, deleteProduct, adjustProductStock,
    addTransaction, updateSettings, resetFactory, clearTransactions,
    clearProducts, resetSettings, deleteTransactions, deleteProducts, importData, logout
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};