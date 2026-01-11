# Admin Setup Guide

Panduan lengkap untuk membuat dan mengelola admin accounts di Solemates.

## Membuat Admin Account

Ada beberapa cara untuk membuat admin account:

### Cara 1: Update Existing User

Jika Anda sudah memiliki akun customer, Anda bisa upgrade menjadi admin:

1. Login ke Supabase Dashboard
2. Buka SQL Editor
3. Jalankan query berikut (ganti dengan email Anda):

```sql
-- Update user berdasarkan email
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### Cara 2: Register Lalu Update

1. Register akun baru melalui aplikasi (`/register`)
2. Login ke Supabase Dashboard
3. Buka SQL Editor
4. Jalankan query di Cara 1

### Cara 3: Direct Insert (Advanced)

Jika Anda ingin membuat admin account langsung:

```sql
-- Catatan: Ini memerlukan user_id dari auth.users
-- Pastikan user sudah dibuat via Supabase Auth terlebih dahulu

INSERT INTO profiles (id, full_name, role)
VALUES (
  'user-id-from-auth-users',
  'Admin Name',
  'admin'
);
```

## Role Types

Ada 3 jenis role di Solemates:

### 1. Customer (Default)
- Access: Own profile, orders, cart, wishlist
- Permissions: Browse products, place orders

### 2. Admin
- Access: Admin dashboard, semua customer data
- Permissions:
  - Manage products (CRUD)
  - View & manage orders
  - Update order status
  - View reports
  - Manage other users

### 3. Super Admin
- Access: Semua fitur admin
- Permissions: Sama seperti admin + bisa manage admin lain

## Verifikasi Admin Access

Setelah mengupdate role, verifikasi dengan:

1. **Logout** dari aplikasi
2. **Login** kembali
3. Seharusnya muncul tombol "Admin" di navbar
4. Klik tombol "Admin" untuk akses admin dashboard

## Quick Admin Creation Script

Untuk development/testing, gunakan script ini:

```sql
-- Buat admin dari user yang baru register
-- Ganti 'admin@example.com' dengan email yang Anda gunakan

UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id
  FROM auth.users
  WHERE email = 'admin@example.com'
);

-- Verifikasi
SELECT
  p.full_name,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('admin', 'super_admin');
```

## Testing Admin Features

Untuk testing, buat 3 akun:

1. **Customer Account**
   - Email: customer@test.com
   - Role: customer
   - Purpose: Test customer features

2. **Admin Account**
   - Email: admin@test.com
   - Role: admin
   - Purpose: Test admin features

3. **Super Admin Account**
   - Email: superadmin@test.com
   - Role: super_admin
   - Purpose: Test full admin capabilities

### Setup Script untuk Testing

```sql
-- Setelah register 3 akun di atas, jalankan:

UPDATE profiles
SET role = CASE
  WHEN id IN (SELECT id FROM auth.users WHERE email = 'admin@test.com') THEN 'admin'
  WHEN id IN (SELECT id FROM auth.users WHERE email = 'superadmin@test.com') THEN 'super_admin'
  ELSE 'customer'
END
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('customer@test.com', 'admin@test.com', 'superadmin@test.com')
);
```

## Troubleshooting

### Admin button tidak muncul setelah update role

1. **Clear browser cache & cookies**
2. **Logout** dari aplikasi
3. **Login** kembali
4. Jika masih tidak muncul, cek role di database:

```sql
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

### Tidak bisa akses admin dashboard

1. Pastikan role adalah 'admin' atau 'super_admin'
2. Pastikan sudah login
3. Akses langsung ke `/admin`
4. Cek console browser untuk error

### RLS Policy errors

Jika admin tidak bisa akses/update data:

```sql
-- Cek apakah RLS policies aktif
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Re-enable RLS jika perlu
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## Best Practices

1. **Jangan buat terlalu banyak admin**
   - 1-2 super admin sudah cukup
   - Assign admin sesuai kebutuhan

2. **Gunakan email yang valid**
   - Untuk recovery dan notifications di masa depan

3. **Secure admin credentials**
   - Gunakan password yang kuat
   - Jangan share admin credentials

4. **Regular audit**
   - Periodic review admin list
   - Remove admin yang tidak aktif

## Admin Features Checklist

Setelah setup admin, test fitur-fitur ini:

- [ ] Access admin dashboard (`/admin`)
- [ ] View statistics (revenue, orders, products, users)
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] View all orders
- [ ] Update order status
- [ ] Add tracking number
- [ ] View all users
- [ ] Change user roles
- [ ] View reports & analytics
- [ ] View top selling products

## Quick Reference

### Useful Queries

```sql
-- Count users by role
SELECT role, COUNT(*) as total
FROM profiles
GROUP BY role;

-- List all admins
SELECT u.email, p.full_name, p.role, p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('admin', 'super_admin')
ORDER BY p.created_at DESC;

-- Downgrade admin to customer
UPDATE profiles
SET role = 'customer'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
```

---

Need help? Check the main README.md or contact support.
