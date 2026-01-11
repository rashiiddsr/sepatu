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
- **PHP API (XAMPP)** - Backend lokal terpisah
  - MySQL Database
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
- XAMPP (Apache + MySQL + PHP 8+)

### Langkah-langkah Instalasi

1. **Clone atau extract project**
   ```bash
   cd solemates
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Database (MySQL)**
   - Buat database `solemates`.
   - Import schema SQL dari `databse/schema.sql` melalui phpMyAdmin atau CLI MySQL.

4. **Setup API PHP (XAMPP)**
   - Letakkan folder `api/` ke `htdocs/solemates/api` (atau sesuaikan path).
   - Konfigurasi kredensial database di `api/config.php` atau set env:
     - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
     - `APP_ORIGIN` (default `http://localhost:5173`)

5. **Environment Variables Frontend**
   Tambahkan `.env` pada root project:
   ```
   VITE_API_URL=http://localhost/solemates/api
   ```

6. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`

7. **Build untuk Production**
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
   Gunakan SQL query di MySQL:
   ```sql
   -- Update user existing menjadi admin
   UPDATE profiles
   SET role = 'admin'
   WHERE id = 'user-id-here';
   ```

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
├── api/                    # PHP API (XAMPP)
│   ├── auth/
│   ├── admin/
│   └── ...
├── databse/                # MySQL schema
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
- Email/password authentication via PHP API
- Session management (cookie-based)
- Protected routes untuk authenticated users
- Admin-only routes untuk admin dashboard

## Sample Data

Database sudah terisi dengan sample data:
- 6 brands (Nike, Adidas, Puma, Converse, Vans, New Balance)
- 8 categories
- 6 sample products dengan images dari Pexels

## Troubleshooting

### Build Errors
```bash
# Clear node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
- Periksa konfigurasi di `api/config.php`
- Pastikan MySQL di XAMPP berjalan

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
