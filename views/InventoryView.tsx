import React, { useState, useRef } from 'react';
import { AlertCircle, Package, X, Check, Trash2, Pencil, Save, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, RefreshCcw, Upload, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

export const InventoryView = React.memo(() => {
  const { user, products, addProduct, updateProduct, deleteProduct, adjustProductStock } = useApp();
  const isAnonymous = user?.isAnonymous;


  // Modal States
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isMutationModalOpen, setMutationModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean, id: string | null, name: string }>({
    isOpen: false,
    id: null,
    name: ''
  });

  // File Input Refs
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Makanan',
    price: 0,
    stock: 0,
    image: ''
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Mutation State
  const [mutationData, setMutationData] = useState<{
    product: Product | null;
    type: 'IN' | 'OUT' | 'RETURN';
    quantity: number;
    note: string;
  }>({
    product: null,
    type: 'IN',
    quantity: 0,
    note: ''
  });

  const totalProducts = products.length;
  const maxProducts = 500;
  const usagePercentage = (totalProducts / maxProducts) * 100;

  // Handle Image Upload with Compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 5MB
      if (file.size > 5000000) {
        alert("Ukuran file terlalu besar! Harap pilih gambar di bawah 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions for compression
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Quality 0.7 for good balance between size and quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

          if (isEdit && editingProduct) {
            setEditingProduct({ ...editingProduct, image: compressedBase64 });
          } else {
            setNewProduct({ ...newProduct, image: compressedBase64 });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };


  const generateSKU = (name: string, sequence: number, stockValue: number) => {
    if (!name) return '';
    const initials = name
      .trim()
      .split(/\s+/)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);

    // Padding length depends on the number of digits in the stock value
    const padding = Math.max(1, stockValue.toString().length);
    const numStr = sequence.toString().padStart(padding, '0');

    return `${initials}-${numStr}`;
  };


  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const productToAdd: Product = {
        id: `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category || 'Lainnya',
        price: Number(newProduct.price) || 0,
        stock: Number(newProduct.stock) || 0,
        image: newProduct.image || `https://via.placeholder.com/150?text=${newProduct.name?.charAt(0)}`
      };

      await addProduct(productToAdd);
      setAddModalOpen(false);
      setNewProduct({ name: '', sku: '', category: 'Makanan', price: 0, stock: 0, image: '' });
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateProduct(editingProduct);
      setEditModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteData({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (deleteData.id && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await deleteProduct(deleteData.id);
        setDeleteData({ isOpen: false, id: null, name: '' });
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus produk.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // --- Mutation Handlers ---
  const handleMutationClick = (product: Product) => {
    setMutationData({
      product,
      type: 'IN',
      quantity: 0,
      note: ''
    });
    setMutationModalOpen(true);
  };

  const handleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutationData.product || mutationData.quantity <= 0 || isSubmitting) return;

    let amount = mutationData.quantity;

    if (mutationData.type === 'OUT') {
      amount = -amount;
      if (mutationData.product.stock + amount < 0) {
        alert("Gagal: Stok tidak mencukupi untuk mutasi keluar.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await adjustProductStock(
        mutationData.product.id,
        amount,
        mutationData.type,
        mutationData.note || 'Mutasi Manual'
      );
      setMutationModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan mutasi stok.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto pb-24 md:pb-8 print:hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Stok</h2>
          <p className="text-gray-500 text-sm md:text-base">Pantau, tambah, dan atur stok produk Anda.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 md:px-6 py-3 rounded-xl font-medium shadow-md transition-colors flex items-center w-full md:w-auto justify-center"
        >
          <Package size={20} className="mr-2" /> Tambah Produk
        </button>
      </div>

      {/* Usage Limit Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 md:mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700 text-sm md:text-base">Penggunaan Produk (Paket Basic)</span>
          <span className="text-sm font-bold text-teal-600">{totalProducts} / {maxProducts} SKU</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-teal-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Upgrade ke Premium untuk SKU tak terbatas.</p>
      </div>

      {/* Table - Responsive Wrapper */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-16">Foto</th>
                <th className="p-4 font-semibold">Nama Produk</th>
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">Harga</th>
                <th className="p-4 font-semibold">Sisa Stok</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((item) => {
                let statusColor = 'bg-green-100 text-green-700';
                let statusText = 'Aman';

                if (item.stock <= 5) {
                  statusColor = 'bg-red-100 text-red-700';
                  statusText = 'Kritis';
                } else if (item.stock <= 15) {
                  statusColor = 'bg-yellow-100 text-yellow-700';
                  statusText = 'Menipis';
                }

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                    <td className="p-4 text-gray-500 font-mono text-sm">{item.sku}</td>
                    <td className="p-4 text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.category}</span></td>
                    <td className="p-4 text-gray-600 text-sm">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="p-4 font-bold text-gray-800">{item.stock}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor} inline-flex items-center`}>
                        {(item.stock <= 5) && <AlertCircle size={12} className="mr-1" />}
                        {statusText}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleMutationClick(item)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Mutasi Stok (Masuk/Keluar/Retur)"
                        >
                          <ArrowRightLeft size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Produk"
                        >
                          <Pencil size={18} />
                        </button>
                        {!isAnonymous && (
                          <button
                            onClick={() => handleDeleteClick(item.id, item.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-gray-800">Tambah Produk Baru</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">

              {/* Image Uploader */}
              <div className="flex justify-center mb-4">
                <div
                  onClick={() => addImageInputRef.current?.click()}
                  className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 hover:border-teal-500 hover:bg-teal-50 cursor-pointer flex flex-col items-center justify-center text-gray-400 transition-all overflow-hidden relative group"
                >
                  {newProduct.image ? (
                    <>
                      <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="mb-2" />
                      <span className="text-xs font-medium">Upload Foto</span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={addImageInputRef}
                    onChange={(e) => handleImageUpload(e, false)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={e => {
                    const name = e.target.value;
                    const sequence = products.length + 1;
                    const sku = generateSKU(name, sequence, Number(newProduct.stock) || 0);
                    setNewProduct({ ...newProduct, name, sku });
                  }}

                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  placeholder="Contoh: Kopi Hitam"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SKU (Kode)</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                    placeholder="BV-00X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="text"
                    required
                    value={newProduct.price ? newProduct.price.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewProduct({ ...newProduct, price: val ? parseInt(val, 10) : 0 });
                    }}
                    onFocus={(e) => {
                      if (newProduct.price === 0) {
                        setNewProduct({ ...newProduct, price: '' as any });
                      }
                      e.target.select();
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  />

                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProduct.stock}
                    onChange={e => {
                      const stockValue = Number(e.target.value);
                      const sequence = products.length + 1;
                      const sku = generateSKU(newProduct.name || '', sequence, stockValue);
                      setNewProduct({ ...newProduct, stock: stockValue, sku });
                    }}

                    onFocus={(e) => {
                      if (newProduct.stock === 0) {
                        setNewProduct({ ...newProduct, stock: '' as any });
                      }
                      e.target.select();
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  />

                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setAddModalOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 shadow-lg shadow-teal-600/30 transition-all active:scale-95">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-gray-800">Edit Produk</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">

              {/* Image Uploader for Edit */}
              <div className="flex justify-center mb-4">
                <div
                  onClick={() => editImageInputRef.current?.click()}
                  className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center text-gray-400 transition-all overflow-hidden relative group"
                >
                  {editingProduct.image ? (
                    <>
                      <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="mb-2" />
                      <span className="text-xs font-medium">Upload Foto</span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={editImageInputRef}
                    onChange={(e) => handleImageUpload(e, true)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SKU (Kode)</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.price ? editingProduct.price.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEditingProduct({ ...editingProduct, price: val ? parseInt(val, 10) : 0 });
                    }}
                    onFocus={(e) => {
                      if (editingProduct.price === 0) {
                        setEditingProduct({ ...editingProduct, price: '' as any });
                      }
                      e.target.select();
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                  />

                </div>
                <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-800 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    disabled
                    value={editingProduct.stock}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-blue-200 text-gray-500 font-bold focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-[10px] text-blue-600 mt-1 ml-1">*Gunakan tombol Mutasi untuk ubah stok</p>
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex justify-center items-center">
                  <Save size={18} className="mr-2" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MUTATION MODAL */}
      {isMutationModalOpen && mutationData.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center">
                <ArrowRightLeft className="mr-2 text-purple-600" size={20} /> Mutasi Stok
              </h3>
              <button onClick={() => setMutationModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleMutationSubmit} className="p-6">

              {/* Product Info Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex justify-between items-center">
                <div className="flex items-center">
                  {/* Tiny Image Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-gray-200 border border-gray-300 mr-3 overflow-hidden">
                    {mutationData.product.image && <img src={mutationData.product.image} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{mutationData.product.name}</h4>
                    <p className="text-sm text-gray-500">{mutationData.product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Stok Saat Ini</p>
                  <p className="text-2xl font-bold text-gray-800">{mutationData.product.stock}</p>
                </div>
              </div>

              {/* Mutation Type Selectors */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setMutationData({ ...mutationData, type: 'IN' })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mutationData.type === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                >
                  <ArrowDownCircle size={24} className="mb-2" />
                  <span className="font-bold text-sm">Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMutationData({ ...mutationData, type: 'OUT' })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mutationData.type === 'OUT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                >
                  <ArrowUpCircle size={24} className="mb-2" />
                  <span className="font-bold text-sm">Keluar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMutationData({ ...mutationData, type: 'RETURN' })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mutationData.type === 'RETURN' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                >
                  <RefreshCcw size={24} className="mb-2" />
                  <span className="font-bold text-sm">Retur</span>
                </button>
              </div>

              {/* Quantity Input */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Jumlah {mutationData.type === 'IN' ? 'Masuk' : mutationData.type === 'OUT' ? 'Keluar' : 'Retur'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={mutationData.quantity || ''}
                  onChange={(e) => setMutationData({ ...mutationData, quantity: parseInt(e.target.value) || 0 })}
                  onFocus={(e) => {
                    if (mutationData.quantity === 0) {
                      setMutationData({ ...mutationData, quantity: '' as any });
                    }
                    e.target.select();
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-xl font-bold text-gray-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                  placeholder="0"
                />
              </div>

              {/* Note Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-1">Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={mutationData.note}
                  onChange={(e) => setMutationData({ ...mutationData, note: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                  placeholder="Contoh: Stok tambahan dari supplier..."
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button type="button" onClick={() => setMutationModalOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">Batal</button>
                <button
                  type="submit"
                  className={`flex-1 py-3 text-white rounded-xl font-medium shadow-lg transition-all active:scale-95 flex justify-center items-center ${mutationData.type === 'IN' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30' :
                    mutationData.type === 'OUT' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' :
                      'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                    }`}
                >
                  <Save size={18} className="mr-2" /> Simpan Mutasi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteData.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center transform scale-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Produk?</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Anda akan menghapus produk <strong>{deleteData.name}</strong> secara permanen. Stok tersisa akan dihapus.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteData({ isOpen: false, id: null, name: '' })}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});