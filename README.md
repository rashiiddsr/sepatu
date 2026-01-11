# Solemates - Sistem Informasi Penjualan Sepatu Online

Solemates adalah sistem informasi e-commerce lengkap untuk penjualan sepatu online dengan fitur customer dan admin yang komprehensif.

## Fitur Utama

### Halaman Publik (Tanpa Login)
- Landing page dengan katalog sepatu
- Pencarian dan filter produk (brand, ukuran, harga, kategori)
- Detail produk dengan gambar, deskripsi, dan spesifikasi
- Registrasi dan login

### Fitur Customer (Setelah Login)
- Profil pengguna (edit data pribadi)
- Riwayat pembelian dan status pesanan
- Wishlist produk favorit
- Keranjang belanja
- Checkout dan pembayaran
- Tracking pengiriman

### Dashboard Admin (Role Admin)
- **Manajemen Produk:** CRUD sepatu (tambah, edit, hapus, stok)
- **Manajemen User:** Kelola akun customer dan admin
- **Manajemen Role:** Atur hak akses (admin, super admin, customer)
- **Manajemen Pesanan:** Proses order, update status, tracking
- **Laporan:** Penjualan, stok, customer analytics

## Teknologi yang Digunakan

### Frontend
- **React** dengan **TypeScript** - Framework UI
- **Tailwind CSS** - Styling
- **React Router** - Navigasi
- **Lucide React** - Icon library

### Backend & Database
- **Node.js API (Express)** - Backend lokal terpisah
  - Koneksi ke **MySQL** untuk data utama
  - Authentication (Email/Password) via session

### Build Tools
- **Vite** - Build tool dan dev server
- **npm** - Package manager

## Struktur Database

### Tables
1. **profiles** - Informasi pengguna (extends auth.users)
2. **brands** - Brand sepatu
3. **categories** - Kategori produk
4. **products** - Data produk sepatu
5. **cart_items** - Keranjang belanja
6. **wishlist** - Daftar keinginan
7. **orders** - Pesanan
8. **order_items** - Detail item pesanan

## Instalasi

### Prasyarat
- Node.js 18+ dan npm

### Langkah-langkah Instalasi

1. **Clone atau extract project**
   ```bash
   cd solemates
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup API Node.js (port 4000)**
   - Masuk ke folder `api/`
   - Install dependencies:
     ```bash
     npm install
     ```
   - Import schema database MySQL dari `databse/schema.sql` ke MySQL (XAMPP/phpMyAdmin).
   - Pastikan konfigurasi database ada di `api/.env`:
     ```bash
     PORT=4000
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=solemates
     DB_PASSWORD=solemates_password
     DB_NAME=solemates
     ```
   - Jalankan server API:
     ```bash
     npm run dev
     ```

4. **Jalankan Development Server (port 5173)**
   - Pastikan file `.env` di root berisi:
     ```bash
     VITE_API_URL=http://localhost:4000/api
     ```
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`

5. **Build untuk Production**
   ```bash
   npm run build
   ```

## Panduan Penggunaan

### Untuk Customer

1. **Registrasi**
   - Klik "Sign Up" di navbar
   - Isi nama lengkap, email, dan password
   - Account otomatis dibuat dengan role "customer"

2. **Browse & Search Products**
   - Gunakan search bar untuk mencari produk
   - Filter berdasarkan brand, category, dan price range
   - Klik produk untuk melihat detail lengkap

3. **Shopping**
   - Pilih size dan color di halaman detail produk
   - Add to Cart atau Add to Wishlist
   - Checkout dari halaman Cart

4. **Order Tracking**
   - Lihat riwayat pesanan di Dashboard
   - Track status pesanan (pending, processing, shipped, delivered)

### Untuk Admin

1. **Akses Admin Panel**
   - Login dengan akun yang memiliki role "admin" atau "super_admin"
   - Klik tombol "Admin" di navbar
   - Atau akses langsung ke `/admin`

2. **Membuat Admin Account**
   Akun admin default tersedia di API:
   - Email: `admin@solemates.local`
   - Password: `admin123`

3. **Manajemen Produk**
   - Tambah produk baru dengan form lengkap
   - Edit produk existing
   - Update stok dan harga
   - Tandai produk sebagai "Featured"

4. **Manajemen Pesanan**
   - View semua pesanan
   - Update status pesanan
   - Input tracking number
   - View detail lengkap pesanan

5. **Manajemen User**
   - Lihat semua users
   - Ubah role user (customer, admin, super_admin)
   - Filter berdasarkan role

6. **Reports & Analytics**
   - Total revenue
   - Total orders dan products
   - Top selling products
   - Recent orders

## Struktur Folder

```
solemates/
├── api/                    # Node.js API (Express)
│   ├── src/
│   └── data/
├── databse/                # MySQL schema (referensi)
│   └── schema.sql
├── src/
│   ├── components/          # Reusable components
│   │   └── Navbar.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/                 # Libraries & utilities
│   │   └── api.ts
│   ├── pages/              # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Home.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Wishlist.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Checkout.tsx
│   │   └── admin/          # Admin pages
│   │       ├── AdminLayout.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── ProductManagement.tsx
│   │       ├── UserManagement.tsx
│   │       ├── OrderManagement.tsx
│   │       └── Reports.tsx
│   ├── types/              # TypeScript types
│   │   └── database.ts
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── .env                    # Environment variables
├── package.json
└── README.md
```

## Security Features

### Authentication
- Email/password authentication via Node.js API
- Session management (cookie-based)
- Protected routes untuk authenticated users
- Admin-only routes untuk admin dashboard

## Sample Data

API sudah terisi dengan sample data:
- 2 brands (Nike, Adidas)
- 2 categories
- 3 sample products dengan images dari Pexels

## Troubleshooting

### Build Errors
```bash
# Clear node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues
- Pastikan API Node.js berjalan di port 4000 (`api/.env` untuk konfigurasi)
- Pastikan `VITE_API_URL` mengarah ke `http://localhost:4000/api`

### Role Issues
- Jika admin tidak bisa akses data, cek role di `profiles` table
- Pastikan user sudah login dan session aktif

## Scripts Available

```bash
npm run dev        # Start development server
npm run build      # Build untuk production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

Fitur yang bisa ditambahkan:
- Payment gateway integration (Midtrans, Stripe)
- Email notifications
- Product reviews & ratings
- Advanced search dengan Algolia
- Image upload untuk products
- Multiple shipping addresses
- Discount codes & promotions
- Real-time chat support

## License

This project is created for educational purposes.

## Support

Untuk pertanyaan atau issues, silakan hubungi developer atau buat issue di repository.

---

**Solemates** - Find Your Perfect Sole
