import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, Printer, CheckCircle, Share2, Smartphone, X, Eye, ArrowRightLeft, Banknote, ChevronUp, Loader2 } from 'lucide-react';
import { Product, CartItem, Transaction } from '../types';
import { useApp } from '../context/AppContext';
import { ReceiptTemplate } from '../components/ReceiptTemplate';

// Helper icon for empty state
const ShoppingBagIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export const POSView = React.memo(() => {
  const { products, addTransaction, settings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Mobile specific state
  const [isMobileCartOpen, setMobileCartOpen] = useState(false);

  // Payment States
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'confirm' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER' | null>(null);

  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // State for Receipt Preview Modal
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  // State for Clear Cart Confirmation
  const [isClearCartConfirmOpen, setClearCartConfirmOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > product.stock) return item;
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCartClick = () => {
    if (cart.length > 0) {
      setClearCartConfirmOpen(true);
    }
  };

  const confirmClearCart = () => {
    setCart([]);
    setClearCartConfirmOpen(false);
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = Math.round(cartSubtotal * (settings.taxRate / 100));
  const cartTotal = cartSubtotal + taxAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const initiatePayment = () => {
    if (cart.length === 0) return;
    setPaymentModalOpen(true);
    setPaymentStep('method');
    setSelectedMethod(null);
  };

  const selectPaymentMethod = (method: 'CASH' | 'QRIS' | 'TRANSFER') => {
    setSelectedMethod(method);
    setPaymentStep('confirm');
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const confirmPayment = async () => {
    if (!selectedMethod || isProcessing) return;

    setIsProcessing(true);
    try {
      const newTransaction: Transaction = {
        id: `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        date: new Date().toISOString(),
        subtotal: cartSubtotal,
        taxAmount: taxAmount,
        total: cartTotal,
        paymentMethod: selectedMethod,
        items: [...cart]
      };

      await addTransaction(newTransaction);
      setLastTransaction(newTransaction);
      setPaymentStep('success');
    } catch (error) {
      console.error("Payment failed", error);
      alert("Gagal memproses transaksi. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };


  const cancelPaymentProcess = () => {
    setPaymentModalOpen(false);
    setPaymentStep('method');
    setSelectedMethod(null);
  }

  const resetOrder = () => {
    setCart([]);
    setPaymentModalOpen(false);
    setShowReceiptPreview(false);
    setPaymentStep('method');
    setSelectedMethod(null);
    setLastTransaction(null);
    setMobileCartOpen(false); // Close mobile cart
  };

  const handleWhatsApp = () => {
    if (!lastTransaction) return;

    const header = `*Struk Digital - ${settings.storeName}*\n\n`;
    const date = `Tanggal: ${new Date(lastTransaction.date).toLocaleString('id-ID')}\n`;
    const id = `ID: ${lastTransaction.id}\n`;
    const divider = `--------------------------------\n`;
    let items = '';
    lastTransaction.items.forEach(item => {
      items += `${item.name} x${item.quantity}\nRp ${(item.price * item.quantity).toLocaleString('id-ID')}\n`;
    });
    const subtotal = `\nSubtotal: Rp ${lastTransaction.subtotal.toLocaleString('id-ID')}`;
    const tax = lastTransaction.taxAmount > 0 ? `\nPPN (${settings.taxRate}%): Rp ${lastTransaction.taxAmount.toLocaleString('id-ID')}` : '';
    const total = `\n*TOTAL: Rp ${lastTransaction.total.toLocaleString('id-ID')}*\n`;
    const footer = `\nTerima kasih telah berbelanja!`;

    const message = encodeURIComponent(header + date + id + divider + items + divider + subtotal + tax + total + footer);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleOpenPreview = () => {
    setShowReceiptPreview(true);
  };

  const executePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex h-full overflow-hidden print:hidden relative">
        {/* Product Grid Area - Responsive width based on cart visibility */}
        <div className="flex-1 flex flex-col bg-gray-50 lg:border-r border-gray-200 h-full">
          <div className="p-3 md:p-6 pb-2">
            <div className="relative group">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Cari produk..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm text-base md:text-lg placeholder-gray-400 outline-none transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 md:p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-4 content-start pb-24 md:pb-6">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id)?.quantity || 0;
              // Calculate effective remaining stock
              const currentStock = Math.max(0, product.stock - inCart);
              const isOutOfStock = currentStock === 0;

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col overflow-hidden text-left group active:scale-95 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden relative">
                    <img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {inCart > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-teal-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                        {inCart}
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold bg-red-600 px-2 py-1 rounded text-[10px]">HABIS</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col flex-1 w-full">
                    <h3 className="font-bold text-gray-800 line-clamp-2 text-[10px] sm:text-xs leading-tight mb-1">{product.name}</h3>
                    <div className="flex flex-col justify-between items-start mt-auto">
                      <span className="text-teal-600 font-bold text-xs">Rp {product.price.toLocaleString('id-ID')}</span>
                      <span className={`text-[9px] font-medium ${currentStock < 5 ? 'text-red-500' : 'text-gray-400'}`}>{currentStock} stok</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet Sticky Summary Bar - Visible on mobile/tablet when items in cart */}
        {cart.length > 0 && (
          <div className="lg:hidden absolute bottom-4 left-4 right-4 z-20">
            <button
              onClick={() => setMobileCartOpen(true)}
              className="w-full bg-teal-800 text-white p-4 rounded-xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-5"
            >
              <div className="flex items-center">
                <div className="bg-teal-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-3">
                  {totalItems}
                </div>
                <div className="text-left">
                  <p className="text-xs text-teal-200">Total</p>
                  <p className="font-bold text-lg">Rp {cartTotal.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center font-bold text-sm">
                Lihat Keranjang <ChevronUp size={16} className="ml-1" />
              </div>
            </button>
          </div>
        )}

        {/* Cart Sidebar / Mobile Modal */}
        <div className={`
            bg-white flex flex-col shadow-2xl transition-all duration-300
            lg:w-96 lg:relative lg:z-20 lg:translate-y-0 border-l border-gray-200
            ${isMobileCartOpen ? 'fixed inset-0 z-50 translate-y-0' : 'fixed inset-0 z-50 translate-y-full lg:translate-y-0 pointer-events-none lg:pointer-events-auto'}
        `}>
          <div className="p-4 md:p-5 border-b border-gray-100 bg-white flex justify-between items-center safe-top">
            <div className="flex items-center">
              {/* Close Button - Visible on Mobile & Tablet */}
              <button onClick={() => setMobileCartOpen(false)} className="lg:hidden mr-3 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <ChevronUp className="rotate-180" size={20} />
              </button>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Keranjang</h2>
                <span className="text-sm text-gray-400">{cart.length} Item</span>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCartClick}
                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center border border-red-100 active:scale-95"
                title="Kosongkan Keranjang"
              >
                <Trash2 size={14} className="mr-1.5" /> Hapus
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <ShoppingBagIcon size={48} className="mb-2 opacity-20" />
                <p>Keranjang kosong</p>
                <button onClick={() => setMobileCartOpen(false)} className="lg:hidden mt-4 text-teal-600 font-bold text-sm hover:underline">
                  Mulai Belanja
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                  <div className="flex-1 mr-2 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</h4>
                    <p className="text-teal-600 text-sm font-bold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-1 border border-gray-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-teal-50 rounded text-teal-600">
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-white border-t border-gray-100 space-y-3 pb-safe">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
            </div>
            {settings.taxRate > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>PPN ({settings.taxRate}%)</span>
                <span className="font-medium">Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold text-gray-800 pt-2 border-t border-gray-100">
              <span>Total Akhir</span>
              <span className="text-teal-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>
            <button
              onClick={initiatePayment}
              disabled={cart.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/30 transition-all active:scale-95 flex items-center justify-center text-lg"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>

        {/* Clear Cart Confirmation Modal */}
        {isClearCartConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center transform scale-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Semua Item?</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Anda akan menghapus <strong>{cart.length} item</strong> dari keranjang. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setClearCartConfirmOpen(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmClearCart}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors active:scale-95"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">
                  {paymentStep === 'method' && 'Pilih Pembayaran'}
                  {paymentStep === 'confirm' && 'Konfirmasi Pembayaran'}
                  {paymentStep === 'success' && 'Pembayaran Berhasil'}
                </h3>
                {paymentStep !== 'success' && (
                  <button onClick={cancelPaymentProcess} className="text-gray-400 hover:text-gray-600">
                    Tutup
                  </button>
                )}
              </div>

              <div className="p-6 flex-1 overflow-y-auto">

                {/* STEP 1: PILIH METODE */}
                {paymentStep === 'method' && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <p className="text-gray-500 mb-1">Total Tagihan</p>
                      <h2 className="text-3xl font-bold text-teal-700">Rp {cartTotal.toLocaleString('id-ID')}</h2>
                    </div>

                    <button onClick={() => selectPaymentMethod('CASH')} className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all group">
                      <div className="bg-green-100 p-3 rounded-lg text-green-700 mr-4 group-hover:bg-teal-200">
                        <Banknote size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-800">Tunai (Cash)</h4>
                        <p className="text-sm text-gray-500">Bayar dengan uang tunai</p>
                      </div>
                    </button>

                    <button onClick={() => selectPaymentMethod('QRIS')} className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all group">
                      <div className="bg-blue-100 p-3 rounded-lg text-blue-700 mr-4 group-hover:bg-blue-200">
                        <Smartphone size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-800">QRIS</h4>
                        <p className="text-sm text-gray-500">Scan QR code</p>
                      </div>
                    </button>

                    <button onClick={() => selectPaymentMethod('TRANSFER')} className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all group">
                      <div className="bg-purple-100 p-3 rounded-lg text-purple-700 mr-4 group-hover:bg-purple-200">
                        <ArrowRightLeft size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-800">Transfer Bank</h4>
                        <p className="text-sm text-gray-500">Transfer manual ke rekening</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* STEP 2: KONFIRMASI */}
                {paymentStep === 'confirm' && (
                  <div className="flex flex-col items-center justify-center text-center py-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-6">
                      {selectedMethod === 'CASH' && <Banknote size={32} />}
                      {selectedMethod === 'QRIS' && <Smartphone size={32} />}
                      {selectedMethod === 'TRANSFER' && <ArrowRightLeft size={32} />}
                    </div>

                    <p className="text-gray-500 mb-2">Metode Pembayaran</p>
                    <h3 className="text-xl font-bold text-gray-800 mb-6 bg-gray-50 px-6 py-2 rounded-lg inline-block">
                      {selectedMethod === 'CASH' && 'Tunai (Cash)'}
                      {selectedMethod === 'QRIS' && 'QRIS'}
                      {selectedMethod === 'TRANSFER' && 'Transfer Bank'}
                    </h3>

                    {/* Transaction Breakdown */}
                    <div className="w-full bg-gray-50 p-4 rounded-xl mb-6">
                      <div className="flex justify-between text-gray-600 mb-2">
                        <span>Subtotal</span>
                        <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {taxAmount > 0 && (
                        <div className="flex justify-between text-gray-600 mb-2">
                          <span>PPN ({settings.taxRate}%)</span>
                          <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
                        <span>Total Tagihan</span>
                        <span className="text-teal-700 text-xl">Rp {cartTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <button
                        onClick={confirmPayment}
                        disabled={isProcessing}
                        className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Konfirmasi Pembayaran'
                        )}
                      </button>


                      <button
                        onClick={cancelPaymentProcess}
                        className="w-full bg-white text-red-500 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors"
                      >
                        Batalkan Transaksi
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: SUKSES */}
                {paymentStep === 'success' && (
                  <div className="flex flex-col items-center justify-center text-center py-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce">
                      <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaksi Berhasil!</h2>
                    <p className="text-gray-500 mb-8">Pembayaran {lastTransaction?.paymentMethod} diterima.</p>

                    <div className="grid grid-cols-2 gap-4 w-full">
                      <button onClick={handleWhatsApp} className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors">
                        <Share2 size={24} className="mb-2" />
                        <span className="font-medium text-sm">Kirim WA</span>
                      </button>
                      <button onClick={handleOpenPreview} className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                        <Eye size={24} className="mb-2" />
                        <span className="font-medium text-sm">Lihat Struk</span>
                      </button>
                    </div>
                    <button onClick={resetOrder} className="mt-6 text-gray-400 font-medium hover:text-gray-600">
                      Lewati & Transaksi Baru
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Receipt Preview Modal */}
        {showReceiptPreview && lastTransaction && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-700">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900">
                <h3 className="font-bold text-xl text-white flex items-center">
                  <Printer size={20} className="mr-3 text-teal-400" />
                  Pratinjau Struk
                </h3>
                <button
                  onClick={() => setShowReceiptPreview(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Receipt Preview Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-800/50 flex justify-center items-start">
                <div className="shadow-2xl ring-1 ring-black/5 flex-shrink-0">
                  <ReceiptTemplate transaction={lastTransaction} settings={settings} />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-5 border-t border-slate-800 bg-slate-900 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowReceiptPreview(false)}
                  className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-700"
                >
                  Tutup
                </button>
                <button
                  onClick={executePrint}
                  className="py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transform active:scale-95"
                >
                  <Printer size={20} className="mr-2" /> Cetak
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden DOM for Actual Browser Printing */}
      <div className="fixed top-0 left-0 w-full z-[-1] opacity-0 pointer-events-none print:static print:opacity-100 print:z-[9999] print-only">
        {lastTransaction && (

          <ReceiptTemplate transaction={lastTransaction} settings={settings} />
        )}
      </div>

    </>
  );
});