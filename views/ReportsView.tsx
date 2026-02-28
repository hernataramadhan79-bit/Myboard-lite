import React, { useState } from 'react';
import { Calendar, Download, History, ShoppingBag, CreditCard, Clock, Smartphone, ArrowRightLeft, FileText, Package, ArrowDownCircle, ArrowUpCircle, RefreshCcw, PlusCircle, Trash2, Printer, Eye, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { Transaction } from '../types';

export const ReportsView = React.memo(() => {
    const { transactions, stockMutations, settings } = useApp();
    const [activeTab, setActiveTab] = useState<'transactions' | 'stock'>('transactions');

    // State for Receipt Preview in History
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);

    const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const totalOmzet = transactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalTransactions = transactions.length;


    // Simple "Best Seller" logic
    const itemCounts: Record<string, number> = {};
    transactions.forEach(t => {
        t.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });
    const bestSeller = Object.keys(itemCounts).reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b, '-');

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Sort mutations by date (newest first)
    const sortedMutations = [...stockMutations].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const downloadCSV = () => {
        const escapeCSV = (str: string | number) => {
            const stringValue = String(str);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        if (activeTab === 'transactions') {
            if (transactions.length === 0) {
                alert("Belum ada data transaksi untuk diunduh.");
                return;
            }

            const headers = ["ID Transaksi", "Tanggal", "Total", "Metode Pembayaran", "Item"];
            const rows = transactions.map(t => [
                escapeCSV(t.id),
                escapeCSV(new Date(t.date).toLocaleString('id-ID')),
                escapeCSV(t.total),
                escapeCSV(t.paymentMethod),
                escapeCSV(t.items.map(i => `${i.name} (x${i.quantity})`).join('; '))
            ]);

            let csvContent = "data:text/csv;charset=utf-8,"
                + headers.join(",") + "\n"
                + rows.map(e => e.join(",")).join("\n");

            triggerDownload(csvContent, 'laporan_transaksi');
        } else {
            if (stockMutations.length === 0) {
                alert("Belum ada riwayat stok untuk diunduh.");
                return;
            }

            const headers = ["ID Log", "Tanggal", "Produk", "SKU", "Tipe Mutasi", "Jumlah", "Keterangan"];
            const rows = stockMutations.map(m => [
                escapeCSV(m.id),
                escapeCSV(new Date(m.date).toLocaleString('id-ID')),
                escapeCSV(m.productName),
                escapeCSV(m.sku),
                escapeCSV(m.type),
                escapeCSV(m.amount),
                escapeCSV(m.note || '-')
            ]);

            let csvContent = "data:text/csv;charset=utf-8,"
                + headers.join(",") + "\n"
                + rows.map(e => e.join(",")).join("\n");

            triggerDownload(csvContent, 'laporan_mutasi_stok');
        }
    };

    const triggerDownload = (content: string, filenamePrefix: string) => {
        const encodedUri = encodeURI(content);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filenamePrefix}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewReceipt = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowReceiptPreview(true);
    };

    const executePrint = () => {
        window.print();
    };

    const getPaymentBadge = (method: string) => {
        switch (method) {
            case 'QRIS':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center border bg-blue-50 text-blue-700 border-blue-100">
                        <Smartphone size={10} className="mr-1" /> QRIS
                    </span>
                );
            case 'TRANSFER':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center border bg-purple-50 text-purple-700 border-purple-100">
                        <ArrowRightLeft size={10} className="mr-1" /> TRANSFER
                    </span>
                );
            case 'CASH':
            default:
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center border bg-green-50 text-green-700 border-green-100">
                        <CreditCard size={10} className="mr-1" /> TUNAI
                    </span>
                );
        }
    };

    const getMutationBadge = (type: string) => {
        switch (type) {
            case 'IN':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center justify-center w-24"><ArrowDownCircle size={12} className="mr-1" /> MASUK</span>;
            case 'OUT':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center justify-center w-24"><ArrowUpCircle size={12} className="mr-1" /> KELUAR</span>;
            case 'RETURN':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center justify-center w-24"><RefreshCcw size={12} className="mr-1" /> RETUR</span>;
            case 'NEW':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center justify-center w-24"><PlusCircle size={12} className="mr-1" /> BARU</span>;
            case 'DELETE':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 flex items-center justify-center w-24"><Trash2 size={12} className="mr-1" /> HAPUS</span>;
            case 'SALE':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700 flex items-center justify-center w-24"><ShoppingBag size={12} className="mr-1" /> TERJUAL</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{type}</span>;
        }
    };

    return (
        <>
            <div className="p-4 md:p-8 h-full overflow-y-auto flex flex-col items-center pb-24 md:pb-8 print:hidden">

                {/* Header Section */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Pusat Laporan</h2>
                    <p className="text-gray-500 text-sm">
                        Ringkasan kinerja toko dan riwayat stok bulan {currentMonth}.
                    </p>
                </div>

                {/* Tabs */}
                <div className="w-full max-w-md md:max-w-none md:w-auto bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 mb-8 mx-auto">
                    <div className="grid grid-cols-2 gap-2 md:flex md:gap-0 md:space-x-2">
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`justify-center px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center transition-all md:px-6 ${activeTab === 'transactions'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <FileText size={16} className="mr-2 shrink-0" />
                            <span className="truncate">Laporan Penjualan</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`justify-center px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center transition-all md:px-6 ${activeTab === 'stock'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Package size={16} className="mr-2 shrink-0" />
                            <span className="truncate">Riwayat Stok</span>
                        </button>
                    </div>
                </div>

                {/* --- CONTENT FOR TRANSACTIONS --- */}
                {activeTab === 'transactions' && (
                    <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
                        {/* Summary Card */}
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm w-full max-w-2xl mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Total Omzet</span>
                                    <span className="font-bold text-teal-700 text-lg whitespace-nowrap">Rp {totalOmzet.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Total Transaksi</span>
                                    <span className="font-bold text-gray-800">{totalTransactions}</span>
                                </div>
                                <div className="flex justify-between py-2 md:border-b border-gray-100">
                                    <span className="text-gray-500">Produk Terlaris</span>
                                    <span className="font-bold text-gray-800 truncate ml-4 text-right max-w-[150px]">{bestSeller}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm">Action</span>
                                    <button
                                        onClick={downloadCSV}
                                        className="text-teal-600 font-bold text-sm hover:underline flex items-center bg-teal-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-teal-100"
                                    >
                                        <Download size={14} className="mr-1.5" /> Unduh CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Table */}
                        <div className="w-full max-w-5xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Detail Transaksi</h3>
                                <span className="text-xs text-gray-500 hidden md:inline">Menampilkan {sortedTransactions.length} transaksi terbaru</span>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="p-4 font-semibold w-48">ID & Waktu</th>
                                                <th className="p-4 font-semibold">Rincian Item</th>
                                                <th className="p-4 font-semibold text-center w-32">Metode</th>
                                                <th className="p-4 font-semibold text-right w-36">Total</th>
                                                <th className="p-4 font-semibold text-center w-20">Struk</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sortedTransactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                                        <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
                                                        <p>Belum ada transaksi tercatat.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                sortedTransactions.map((t) => (
                                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-bold text-gray-800 text-sm">{t.id}</div>
                                                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                                                <Clock size={10} className="mr-1" />
                                                                {new Date(t.date).toLocaleString('id-ID', {
                                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-gray-700 line-clamp-2">
                                                                {t.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {getPaymentBadge(t.paymentMethod)}
                                                        </td>
                                                        <td className="p-4 text-right font-mono font-medium text-gray-800">
                                                            Rp {(Number(t.total) || 0).toLocaleString('id-ID')}
                                                        </td>

                                                        <td className="p-4 text-center">
                                                            <button
                                                                onClick={() => handleViewReceipt(t)}
                                                                className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                                title="Lihat & Cetak Struk"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CONTENT FOR STOCK HISTORY --- */}
                {activeTab === 'stock' && (
                    <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
                        {/* Stock Summary Header */}
                        <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
                            <h3 className="text-lg font-bold text-gray-800 self-start md:self-auto">Log Riwayat Stok</h3>
                            <button
                                onClick={downloadCSV}
                                className="text-teal-600 font-bold text-sm hover:underline flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto justify-center"
                            >
                                <Download size={14} className="mr-2" /> Unduh Laporan Stok
                            </button>
                        </div>

                        <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4 font-semibold w-40">Waktu</th>
                                            <th className="p-4 font-semibold">Produk</th>
                                            <th className="p-4 font-semibold text-center">Tipe Mutasi</th>
                                            <th className="p-4 font-semibold text-right">Jumlah</th>
                                            <th className="p-4 font-semibold w-1/3">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedMutations.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                                    <History size={48} className="mx-auto mb-2 opacity-20" />
                                                    <p>Belum ada riwayat perubahan stok.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedMutations.map((m) => (
                                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-gray-800">
                                                            {new Date(m.date).toLocaleDateString('id-ID')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(m.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-gray-800">{m.productName}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{m.sku}</div>
                                                    </td>
                                                    <td className="p-4 flex justify-center">
                                                        {getMutationBadge(m.type)}
                                                    </td>
                                                    <td className={`p-4 text-right font-mono font-bold ${m.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {m.amount > 0 ? `+${m.amount}` : m.amount}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600 italic">
                                                        "{m.note}"
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- RECEIPT PREVIEW MODAL --- */}
                {showReceiptPreview && selectedTransaction && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-700">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900">
                                <h3 className="font-bold text-xl text-white flex items-center">
                                    <Printer size={20} className="mr-3 text-teal-400" />
                                    Riwayat Struk
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
                                    <ReceiptTemplate transaction={selectedTransaction} settings={settings} />
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
                                    <Printer size={20} className="mr-2" /> Cetak Ulang
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Hidden DOM for Actual Browser Printing */}
            <div className="fixed top-0 left-0 w-full z-[-1] opacity-0 pointer-events-none print:static print:opacity-100 print:z-[9999] print-only">
                {selectedTransaction && (

                    <ReceiptTemplate transaction={selectedTransaction} settings={settings} />
                )}
            </div>

        </>
    );
});