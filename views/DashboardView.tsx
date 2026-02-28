import React from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Package, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../context/AppContext';

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; color: string; colorHex: string }> = ({ title, value, icon, trend, color, colorHex }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorHex}/10 ${color}`}>
        {icon}
      </div>
      {trend && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

export const DashboardView = React.memo(() => {
  const { transactions, products } = useApp();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate metrics
  const today = currentTime.toDateString();

  const todaysTransactions = transactions.filter(t => new Date(t.date).toDateString() === today);

  const totalSalesToday = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
  const estimatedProfit = totalSalesToday * 0.3;
  const totalTransactionCount = todaysTransactions.length;

  // Preparation for Low Stock Alert
  const lowStockProducts = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 5);

  // Preparation for Top Products
  const itemCounts: Record<string, { quantity: number, price: number }> = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (!itemCounts[item.name]) {
        itemCounts[item.name] = { quantity: 0, price: item.price };
      }
      itemCounts[item.name].quantity += item.quantity;
    });
  });

  const topProducts = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Prepare Chart Data (Last 7 days instead of 5)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();

    const daySales = transactions
      .filter(t => new Date(t.date).toDateString() === dayStr)
      .reduce((sum, t) => sum + t.total, 0);

    return {
      name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      sales: daySales,
      profit: daySales * 0.3
    };
  });

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto h-full pb-24 md:pb-8 print:hidden">
      {/* Header with Live Clock */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Beranda</h2>
          <p className="text-slate-500 text-sm">Pantau performa bisnis Anda secara real-time.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-teal-100 shadow-sm flex items-center space-x-3">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
          <span className="text-slate-700 font-mono font-bold text-lg">
            {currentTime.toLocaleTimeString('id-ID')}
          </span>
          <span className="text-xs text-slate-400 font-medium">WIB</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        <MetricCard
          title="Total Penjualan Hari Ini"
          value={`Rp ${totalSalesToday.toLocaleString('id-ID')}`}
          icon={<ShoppingBag size={24} />}
          color="text-teal-600"
          colorHex="bg-teal-500"
          trend="Live"
        />
        <MetricCard
          title="Estimasi Laba Hari Ini"
          value={`Rp ${estimatedProfit.toLocaleString('id-ID')}`}
          icon={<DollarSign size={24} />}
          color="text-blue-600"
          colorHex="bg-blue-500"
        />
        <MetricCard
          title="Total Transaksi Hari Ini"
          value={`${totalTransactionCount} Pesanan`}
          icon={<TrendingUp size={24} />}
          color="text-purple-600"
          colorHex="bg-purple-500"
        />
        <MetricCard
          title="Stok Kritis"
          value={`${lowStockProducts.length > 0 ? lowStockProducts.length : '0'} SKU`}
          icon={<Package size={24} />}
          color="text-red-600"
          colorHex="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm h-80 md:h-[450px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex justify-between items-center">
            Tren Laba Harian (7 Hari Terakhir)
            <span className="text-xs font-normal text-slate-400">Margin Estimasi: 30%</span>
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `Rp ${(value / 1000)}k`} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="profit" name="Laba" radius={[8, 8, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#0d9488' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* Low Stock Widget */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center">
              <AlertCircle size={18} className="mr-2 text-red-500" /> Stok Menipis (Kritis)
            </h4>
            {lowStockProducts.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-sm italic">Semua stok aman 🎉</div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{p.sku}</p>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">{p.stock} Unit</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Selling Widget */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center">
              <TrendingUp size={18} className="mr-2 text-teal-500" /> Produk Terlaris
            </h4>
            {topProducts.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-sm italic">Belum ada penjualan tercatat.</div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center">
                    <span className="w-5 text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <div className="flex-1 ml-2">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{p.name}</p>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-teal-500 h-full transition-all"
                          style={{ width: `${(p.quantity / topProducts[0].quantity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 ml-4">{p.quantity} terjual</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});