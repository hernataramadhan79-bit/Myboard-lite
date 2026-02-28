# MyBoard Lite

<div align="center">
<img width="1200" height="475" alt="MyBoard Lite Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

MyBoard Lite adalah aplikasi Point of Sale (POS) dan manajemen inventaris berbasis web yang dirancang untuk membantu pengelolaan toko dengan lebih efisien. Aplikasi ini menyediakan fitur lengkap untuk transaksi penjualan, pengelolaan stok barang, laporan penjualan, dan pengaturan sistem.

## Fitur Utama

### 🖥️ Dashboard
- Ringkasan statistik penjualan hari ini
- Grafik tren penjualan (harian, mingguan, bulanan)
- Informasi stok rendah (low stock alerts)
- Pendapatan dan jumlah transaksi terbaru

### 💰 Transaksi (POS)
- Antarmuka kasir yang intuitif dan responsif
- Pencarian produk cepat
- Penambahan produk ke keranjang belanja
- Perhitungan otomatis total belanja
- Pembayaran dengan multiple metode
- Pencetakan struk (receipt printing)
- Riwayat transaksi lengkap

### 📦 Stok (Inventory)
- Manajemen produk lengkap (tambah, edit, hapus)
- Kategori produk untuk pengelompokan
- Tracking stok masuk dan keluar
- Notifikasi stok rendah (low stock alerts)
- Pencarian dan filter produk
- Import/Export data produk

### 📊 Laporan
- Laporan penjualan harian, mingguan, bulanan
- Laporan keuntungan (profit report)
- Laporan stok barang
- Grafik visual untuk analisis
- Filter berdasarkan periode tanggal

### ⚙️ Pengaturan
- Profil toko (nama, alamat, nomor telepon)
- Pengaturan receipt (struk)
- Manajemen pengguna
- Pengaturan harga dan pajak
- Backup dan restore data

## Teknologi

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication + Firestore)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite

## Prasyarat

Sebelum memulai, pastikan Anda telah memiliki:

- Node.js (versi 18 atau lebih tinggi)
- Akun Firebase Project
- Browser modern (Chrome, Firefox, Edge, Safari)

## Installation

Ikuti langkah-langkah berikut untuk menjalankan aplikasi secara lokal:

### 1. Clone Repository

```bash
git clone <repository-url>
cd myboard-lite
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Firebase

Buat project Firebase baru di [Firebase Console](https://console.firebase.google.com/):

1. Buat project baru dengan nama "MyBoard Lite"
2. Aktifkan **Authentication** dengan provider Email/Password
3. Aktifkan **Firestore Database** dan buat rulesAllow:
   ```
   allow read, write: if request.auth != null;
   ```
4. Salin konfigurasi Firebase dari Project Settings

### 4. Setup Environment Variables

Edit file `.env.local` dan isi dengan konfigurasi Firebase Anda:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan tersedia di `http://localhost:5173`

## Struktur Folder

```
myboard-lite/
├── src/
│   ├── components/        # Komponen UI reusable
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ReceiptTemplate.tsx
│   ├── context/            # React Context (state management)
│   │   └── AppContext.tsx
│   ├── lib/                # Konfigurasi library
│   │   └── firebase.ts
│   ├── views/              # Halaman utama aplikasi
│   │   ├── DashboardView.tsx
│   │   ├── POSView.tsx
│   │   ├── InventoryView.tsx
│   │   ├── ReportsView.tsx
│   │   └── SettingsView.tsx
│   ├── App.tsx             # Komponen utama aplikasi
│   ├── index.tsx           # Entry point
│   └── types.ts            # TypeScript type definitions
├── public/                 # Asset statis
├── .env.local              # Environment variables
├── package.json            # Dependencies
├── tailwind.config.js      # Konfigurasi Tailwind
├── vite.config.ts          # Konfigurasi Vite
└── tsconfig.json           # Konfigurasi TypeScript
```

## Cara Penggunaan

### Pertama Kali Setup

1. Buka aplikasi di browser
2. Daftar akun baru (akan menjadi admin)
3. Lengkapi profil toko di menu Pengaturan
4. Tambahkan produk pertama Anda di menu Stok

### Transaksi Penjualan

1. Buka menu **Transaksi**
2. Cari produk menggunakan kolom pencarian atau pilih dari daftar
3. Tambah jumlah produk yang diinginkan
4. Klik "Bayar" untuk menyelesaikan transaksi
5. Pilih metode pembayaran
6. Struk akan dicetak (jika printer terhubung) atau dapat di-download

### Manajemen Stok

1. Buka menu **Stok**
2. Klik tombol "Tambah Produk" untuk menambah produk baru
3. Edit produk dengan klik pada baris produk
4. Untuk menambahkan stok, klik tombol "+" pada kolom stok

### Melihat Laporan

1. Buka menu **Laporan**
2. Pilih tipe laporan (Penjualan, Stok, Keuntungan)
3. Atur rentang tanggal
4. Lihat hasil dan analisis data

## Lisensi

MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan.
