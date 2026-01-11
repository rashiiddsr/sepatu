# Admin Setup Guide

Panduan untuk membuat dan mengelola admin account di Solemates dengan API Node.js.

## Akun Admin Default

API sudah menyediakan akun admin untuk development:

- Email: `superadmin@gmail.com`
- Password: `superadmin`

atau gunakan akun admin:

- Email: `admin@solemates.local`
- Password: `admin123`

## Mengubah Role User Menjadi Admin

1. Login sebagai admin default melalui `/admin/login`.
2. Buka halaman **Admin → Users** (`/admin/users`).
3. Ubah role user menjadi `admin` atau `super_admin`.

## Verifikasi Admin Access

1. Logout dari aplikasi.
2. Login kembali menggunakan akun admin.
3. Akses dashboard admin melalui `/admin`.

## Testing Admin Features

Pastikan fitur berikut berjalan:

- [ ] Access admin dashboard (`/admin`)
- [ ] Update role user
- [ ] Manage products
- [ ] Update status order
