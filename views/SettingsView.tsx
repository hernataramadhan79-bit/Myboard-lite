import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Save, Store, Smartphone, MapPin, Database, Download, Upload, Trash2, RefreshCcw, AlertTriangle, X, CheckSquare, Square, ShieldAlert, Loader2, CheckCircle, AlertCircle, FileText, Package, Search, ListFilter, User, Percent } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsView = React.memo(() => {
  const {
    user, settings, products, transactions, updateSettings,
    resetFactory, clearTransactions, clearProducts, resetSettings,
    deleteProducts, deleteTransactions, importData
  } = useApp();

  const isAnonymous = user?.isAnonymous;


  const [formData, setFormData] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData when cloud settings change
  useEffect(() => {
    setFormData(settings);
  }, [settings]);


  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Modal & Selection States (Bulk Delete)
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({
    products: false,
    transactions: false,
    settings: false
  });
  const [confirmationText, setConfirmationText] = useState('');

  // States for "Data Explorer" (Granular Delete)
  const [isExplorerOpen, setExplorerOpen] = useState(false);
  const [explorerTab, setExplorerTab] = useState<'products' | 'transactions'>('transactions');
  const [explorerSearch, setExplorerSearch] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Clear notification automatically
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedItemIds(new Set());
    setExplorerSearch('');
  }, [explorerTab, isExplorerOpen]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const simulateLoading = (text: string, callback: () => void, delay = 1000) => {
    setIsLoading(true);
    setLoadingText(text);
    setTimeout(() => {
      try {
        callback();
      } catch (e) {
        showNotification('error', 'Terjadi kesalahan saat memproses data.');
      } finally {
        setIsLoading(false);
      }
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simulateLoading('Menyimpan Pengaturan...', () => {
      updateSettings(formData);
      showNotification('success', 'Pengaturan berhasil disimpan!');
    }, 1000);
  };

  const handleExport = () => {
    simulateLoading('Mempersiapkan File Backup...', () => {
      const data = {
        settings,
        products,
        transactions,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `myboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();

      showNotification('success', 'Data berhasil diekspor! Unduhan dimulai.');
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      setIsLoading(true);
      setLoadingText('Menganalisis & Memulihkan Data...');

      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        setTimeout(() => {
          try {
            if (event.target?.result) {
              const parsedData = JSON.parse(event.target.result as string);

              if (!parsedData.version && !parsedData.products) {
                throw new Error("Format file tidak valid");
              }

              importData(parsedData);
              setFormData(parsedData.settings || settings);
              showNotification('success', 'Data berhasil dipulihkan dari backup!');
            }
          } catch (error) {
            showNotification('error', 'Gagal impor! File rusak atau format salah.');
          } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }, 2000);
      };
    }
  };

  const toggleOption = (key: keyof typeof deleteOptions) => {
    setDeleteOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const executeDeletion = () => {
    if (confirmationText !== 'KONFIRMASI') return;
    setDeleteModalOpen(false);

    simulateLoading('Menghapus Data Terpilih...', () => {
      let deletedItems = [];
      if (deleteOptions.products) {
        clearProducts();
        deletedItems.push("Produk");
      }
      if (deleteOptions.transactions) {
        clearTransactions();
        deletedItems.push("Transaksi");
      }
      if (deleteOptions.settings) {
        resetSettings();
        setFormData({
          storeName: 'MyBoard Lite - Basic',
          whatsappNumber: '',
          address: '',
          cashierName: 'Admin',
          taxRate: 0
        });
        deletedItems.push("Pengaturan");
      }

      setConfirmationText('');
      setDeleteOptions({ products: false, transactions: false, settings: false });
      showNotification('success', `Berhasil menghapus: ${deletedItems.join(', ')}`);
    }, 2000);
  };

  // --- Explorer / Granular Deletion Logic ---

  const filteredExplorerData = useMemo(() => {
    const search = explorerSearch.toLowerCase();
    if (explorerTab === 'products') {
      return products.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search)
      );
    } else {
      return transactions.filter(t =>
        t.id.toLowerCase().includes(search) ||
        t.date.includes(search)
      );
    }
  }, [explorerTab, explorerSearch, products, transactions]);

  const toggleExplorerItem = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItemIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredExplorerData.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredExplorerData.map(i => i.id)));
    }
  };

  const executeGranularDeletion = () => {
    const count = selectedItemIds.size;
    if (count === 0) return;

    if (!window.confirm(`Yakin ingin menghapus ${count} data terpilih secara permanen?`)) return;

    setExplorerOpen(false);
    simulateLoading(`Menghapus ${count} Data...`, () => {
      const ids = Array.from(selectedItemIds);
      if (explorerTab === 'products') {
        deleteProducts(ids);
      } else {
        deleteTransactions(ids);
      }
      showNotification('success', `${count} item berhasil dihapus.`);
    });
  };

  const isDeleteButtonEnabled =
    (deleteOptions.products || deleteOptions.transactions || deleteOptions.settings) &&
    confirmationText === 'KONFIRMASI';

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto pb-24 md:pb-8 relative print:hidden">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-24 right-4 md:right-8 z-[70] flex items-center p-4 rounded-xl shadow-2xl border animate-in slide-in-from-top-5 fade-in duration-300 max-w-[90vw] md:max-w-md ${notification.type === 'success'
          ? 'bg-white border-green-200 text-green-800'
          : 'bg-white border-red-200 text-red-800'
          }`}>
          <div className={`p-2 rounded-full mr-3 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          </div>
          <div>
            <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Berhasil' : 'Gagal'}</h4>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
          <Loader2 size={64} className="animate-spin text-teal-400 mb-6" />
          <h3 className="text-xl font-bold tracking-wide">{loadingText}</h3>
          <p className="text-sm text-gray-300 mt-2">Mohon tunggu, jangan tutup halaman ini.</p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">

        {/* Kolom Kiri: Profil Toko */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-600 border-b border-gray-200 pb-2">Profil Toko</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">

              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <Store size={18} className="mr-2 text-teal-600" /> Nama Toko
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <User size={18} className="mr-2 text-teal-600" /> Nama Kasir
                </label>
                <input
                  type="text"
                  value={formData.cashierName}
                  onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  placeholder="Contoh: Admin"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <Smartphone size={18} className="mr-2 text-teal-600" /> Nomor WhatsApp (Format: 628xxx)
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                />
                <p className="text-xs text-gray-400 mt-1">Digunakan untuk fitur struk digital WhatsApp.</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <Percent size={18} className="mr-2 text-teal-600" /> PPN / Pajak (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    onFocus={(e) => {
                      if (formData.taxRate === 0) {
                        setFormData({ ...formData, taxRate: '' as any });
                      }
                      e.target.select();
                    }}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"

                  />
                  <span className="absolute right-4 top-3.5 text-gray-500 font-bold">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Persentase pajak yang ditambahkan ke total transaksi.</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <MapPin size={18} className="mr-2 text-teal-600" /> Alamat Toko
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" className="w-full md:w-auto bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/30 active:scale-95">
                  <Save size={20} className="mr-2" /> Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Kolom Kanan: Manajemen Data */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-600 border-b border-gray-200 pb-2">Manajemen Data</h3>

          {/* Backup & Restore Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center mb-4">
              <Database className="text-blue-500 mr-3" size={24} />
              <div>
                <h4 className="font-bold text-gray-800">Backup & Restore</h4>
                <p className="text-xs text-gray-500">Simpan data toko Anda agar aman.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => !isAnonymous && handleExport()}
                disabled={isAnonymous}
                className="flex flex-col items-center justify-center p-4 border border-blue-100 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">Ekspor Data</span>
              </button>


              <button
                onClick={() => !isAnonymous && fileInputRef.current?.click()}
                disabled={isAnonymous}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">Impor Data</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
              </button>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle size={80} className="text-red-500" />
            </div>

            <div className="flex items-center mb-6 relative z-10">
              <ShieldAlert className="text-red-500 mr-3" size={24} />
              <div>
                <h4 className="font-bold text-red-600">Zona Bahaya</h4>
                <p className="text-xs text-red-400">Pengaturan penghapusan data tingkat lanjut.</p>
              </div>
            </div>

            <div className="relative z-10">
              {/* Bulk Delete Button */}
              <button
                onClick={() => !isAnonymous && setDeleteModalOpen(true)}
                disabled={isAnonymous}
                className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold">Hapus Data Spesifik</span>
                  <span className="text-xs opacity-75">Pilih jenis data yang ingin dibersihkan</span>
                </div>
                <Trash2 size={20} />
              </button>

              {/* Granular Data Explorer Button (Moved Here) */}
              <button
                onClick={() => !isAnonymous && setExplorerOpen(true)}
                disabled={isAnonymous}
                className="w-full flex items-center justify-between p-4 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-colors shadow-sm mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold">Kelola Data Satuan</span>
                  <span className="text-xs opacity-75">Cari dan hapus item tertentu satu per satu</span>
                </div>
                <ListFilter size={20} />
              </button>

              {/* Factory Reset Link */}
              <button
                onClick={() => {
                  if (isAnonymous) return;
                  if (window.confirm("PERINGATAN DARURAT: Reset Total akan menghapus SEMUA data dan pengaturan tanpa loading screen. Lanjutkan?")) {
                    resetFactory();
                    setFormData({ storeName: 'MyBoard Lite - Basic', whatsappNumber: '', address: '', cashierName: 'Admin', taxRate: 0 });
                    alert("Data telah direset.");
                  }
                }}
                disabled={isAnonymous}
                className="mt-4 w-full text-xs text-center text-gray-400 hover:text-red-500 hover:underline transition-colors disabled:hover:text-gray-400 disabled:cursor-not-allowed"
              >
                {isAnonymous ? "Fitur reset dinonaktifkan untuk akun demo" : "Butuh Reset Pabrik Cepat (Tanpa Animasi)? Klik di sini."}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* --- MODAL 1: ADVANCED BULK DELETE --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-start">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-700">Penghapusan Data</h3>
                  <p className="text-red-500 text-sm">Pilih data yang ingin dihapus permanen.</p>
                </div>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Bulk Options... */}
              <div onClick={() => toggleOption('products')} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${deleteOptions.products ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`mr-4 ${deleteOptions.products ? 'text-red-600' : 'text-gray-300'}`}>{deleteOptions.products ? <CheckSquare size={24} /> : <Square size={24} />}</div>
                <div><h4 className={`font-bold ${deleteOptions.products ? 'text-red-800' : 'text-gray-700'}`}>Database Produk & Stok</h4><p className="text-xs text-gray-500">Menghapus {products.length} produk. Stok akan hilang.</p></div>
              </div>
              <div onClick={() => toggleOption('transactions')} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${deleteOptions.transactions ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`mr-4 ${deleteOptions.transactions ? 'text-red-600' : 'text-gray-300'}`}>{deleteOptions.transactions ? <CheckSquare size={24} /> : <Square size={24} />}</div>
                <div><h4 className={`font-bold ${deleteOptions.transactions ? 'text-red-800' : 'text-gray-700'}`}>Riwayat Transaksi</h4><p className="text-xs text-gray-500">Menghapus {transactions.length} laporan penjualan.</p></div>
              </div>
              <div onClick={() => toggleOption('settings')} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${deleteOptions.settings ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`mr-4 ${deleteOptions.settings ? 'text-red-600' : 'text-gray-300'}`}>{deleteOptions.settings ? <CheckSquare size={24} /> : <Square size={24} />}</div>
                <div><h4 className={`font-bold ${deleteOptions.settings ? 'text-red-800' : 'text-gray-700'}`}>Pengaturan Toko</h4><p className="text-xs text-gray-500">Reset Nama Toko, Alamat, dll.</p></div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Ketik <span className="font-mono font-bold text-red-600 select-all">KONFIRMASI</span> untuk melanjutkan:</label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 text-center font-bold tracking-widest uppercase focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                  placeholder="KONFIRMASI"
                />
              </div>

              <button onClick={executeDeletion} disabled={!isDeleteButtonEnabled} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center shadow-lg transition-all ${isDeleteButtonEnabled ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                <Trash2 size={20} className="mr-2" /> Hapus Data Terpilih
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: DATA EXPLORER (GRANULAR DELETE) --- */}
      {isExplorerOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-white p-5 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <ListFilter className="mr-2 text-teal-600" /> Pengelola Data Satuan
                </h3>
                <p className="text-sm text-gray-500">Cari, pilih, dan hapus data secara spesifik.</p>
              </div>
              <button onClick={() => setExplorerOpen(false)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tabs & Search */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-full md:w-auto">
                <button
                  onClick={() => setExplorerTab('transactions')}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center transition-all ${explorerTab === 'transactions' ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileText size={16} className="mr-2" /> Transaksi
                </button>
                <button
                  onClick={() => setExplorerTab('products')}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center transition-all ${explorerTab === 'products' ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Package size={16} className="mr-2" /> Produk
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={explorerTab === 'transactions' ? "Cari ID atau Tanggal..." : "Cari Nama atau SKU..."}
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {filteredExplorerData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Search size={48} className="mb-2 opacity-20" />
                  <p>Data tidak ditemukan.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="p-4 w-12 text-center">
                          <button onClick={toggleSelectAll} className="hover:text-teal-600">
                            {selectedItemIds.size === filteredExplorerData.length && filteredExplorerData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </th>
                        <th className="p-4">{explorerTab === 'transactions' ? 'Detail Transaksi' : 'Detail Produk'}</th>
                        <th className="p-4 text-right">{explorerTab === 'transactions' ? 'Total' : 'Stok'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredExplorerData.map((item: any) => {
                        const isSelected = selectedItemIds.has(item.id);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => toggleExplorerItem(item.id)}
                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-teal-50/50' : 'hover:bg-gray-50'}`}
                          >
                            <td className="p-4 text-center">
                              <div className={isSelected ? 'text-teal-600' : 'text-gray-300'}>
                                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                              </div>
                            </td>
                            <td className="p-4">
                              {explorerTab === 'transactions' ? (
                                <>
                                  <div className="font-bold text-gray-800 text-sm">{item.id}</div>
                                  <div className="text-xs text-gray-500">{new Date(item.date).toLocaleString('id-ID')} • {item.paymentMethod}</div>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500">SKU: {item.sku} • Rp {item.price.toLocaleString('id-ID')}</div>
                                </>
                              )}
                            </td>
                            <td className="p-4 text-right font-mono text-sm">
                              {explorerTab === 'transactions' ? (
                                <span className="font-bold text-gray-700">Rp {item.total.toLocaleString('id-ID')}</span>
                              ) : (
                                <span className={`font-bold ${item.stock < 5 ? 'text-red-500' : 'text-gray-700'}`}>{item.stock} Unit</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="bg-white p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Terpilih: <strong className="text-teal-600">{selectedItemIds.size}</strong> item
              </div>
              <button
                onClick={executeGranularDeletion}
                disabled={selectedItemIds.size === 0}
                className={`px-6 py-3 rounded-xl font-bold flex items-center shadow-lg transition-all ${selectedItemIds.size > 0 ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <Trash2 size={18} className="mr-2" />
                Hapus ({selectedItemIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});