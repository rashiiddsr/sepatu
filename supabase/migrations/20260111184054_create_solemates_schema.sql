/*
  # Solemates E-Commerce Database Schema

  ## Overview
  Complete database schema for Solemates shoe e-commerce platform with customer and admin features.

  ## New Tables

  1. **profiles**
     - Extends auth.users with additional user information
     - `id` (uuid, references auth.users)
     - `full_name` (text)
     - `phone` (text)
     - `address` (text)
     - `city` (text)
     - `postal_code` (text)
     - `role` (text) - 'customer', 'admin', 'super_admin'
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. **brands**
     - Shoe brands/manufacturers
     - `id` (uuid, primary key)
     - `name` (text, unique)
     - `description` (text)
     - `logo_url` (text)
     - `created_at` (timestamptz)

  3. **categories**
     - Product categories (Men's, Women's, Kids, Sports, etc.)
     - `id` (uuid, primary key)
     - `name` (text, unique)
     - `description` (text)
     - `created_at` (timestamptz)

  4. **products**
     - Shoe products
     - `id` (uuid, primary key)
     - `name` (text)
     - `description` (text)
     - `brand_id` (uuid, references brands)
     - `category_id` (uuid, references categories)
     - `price` (numeric)
     - `stock` (integer)
     - `sizes` (jsonb) - array of available sizes
     - `colors` (jsonb) - array of available colors
     - `image_url` (text)
     - `images` (jsonb) - array of additional images
     - `is_featured` (boolean)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. **cart_items**
     - Shopping cart items
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `product_id` (uuid, references products)
     - `quantity` (integer)
     - `size` (text)
     - `color` (text)
     - `created_at` (timestamptz)

  6. **wishlist**
     - User wishlist items
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `product_id` (uuid, references products)
     - `created_at` (timestamptz)

  7. **orders**
     - Customer orders
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `order_number` (text, unique)
     - `status` (text) - 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
     - `total_amount` (numeric)
     - `shipping_address` (text)
     - `shipping_city` (text)
     - `shipping_postal_code` (text)
     - `shipping_method` (text)
     - `shipping_cost` (numeric)
     - `tracking_number` (text)
     - `notes` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  8. **order_items**
     - Items in each order
     - `id` (uuid, primary key)
     - `order_id` (uuid, references orders)
     - `product_id` (uuid, references products)
     - `quantity` (integer)
     - `size` (text)
     - `color` (text)
     - `price` (numeric) - price at time of purchase
     - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Customers can view/edit their own data
  - Admins can manage all data
  - Public users can view products, brands, and categories
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  address text,
  city text,
  postal_code text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brands"
  ON brands FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage brands"
  ON brands FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sizes jsonb DEFAULT '[]'::jsonb,
  colors jsonb DEFAULT '[]'::jsonb,
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, size, color)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist items"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist items"
  ON wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_method text NOT NULL,
  shipping_cost numeric NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders ON DELETE CASCADE,
  product_id uuid REFERENCES products ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  size text NOT NULL,
  color text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert sample data for brands
INSERT INTO brands (name, description, logo_url) VALUES
('Nike', 'Just Do It - Leading athletic footwear brand', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=100'),
('Adidas', 'Impossible is Nothing - Sports and lifestyle brand', 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=100'),
('Puma', 'Forever Faster - Athletic and casual footwear', 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=100'),
('Converse', 'Classic canvas sneakers and casual shoes', 'https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=100'),
('Vans', 'Off The Wall - Skateboarding and lifestyle shoes', 'https://images.pexels.com/photos/1478442/pexels-photo-1478442.jpeg?auto=compress&cs=tinysrgb&w=100'),
('New Balance', 'Premium athletic and lifestyle footwear', 'https://images.pexels.com/photos/2529147/pexels-photo-2529147.jpeg?auto=compress&cs=tinysrgb&w=100')
ON CONFLICT (name) DO NOTHING;

-- Insert sample data for categories
INSERT INTO categories (name, description) VALUES
('Men''s Shoes', 'Footwear designed for men'),
('Women''s Shoes', 'Footwear designed for women'),
('Kids'' Shoes', 'Footwear for children'),
('Sports', 'Athletic and performance shoes'),
('Running', 'Running and jogging shoes'),
('Casual', 'Everyday casual footwear'),
('Sneakers', 'Stylish sneakers and trainers'),
('Boots', 'Boots for various occasions')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured)
SELECT 
  'Air Max Velocity',
  'Premium running shoes with advanced cushioning technology. Perfect for daily training and long-distance runs.',
  (SELECT id FROM brands WHERE name = 'Nike'),
  (SELECT id FROM categories WHERE name = 'Running'),
  1299000,
  50,
  '["38", "39", "40", "41", "42", "43", "44", "45"]'::jsonb,
  '["Black", "White", "Blue", "Red"]'::jsonb,
  'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Air Max Velocity');

INSERT INTO products (name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured)
SELECT 
  'Ultra Boost Runner',
  'Revolutionary energy-returning shoes for maximum comfort and performance.',
  (SELECT id FROM brands WHERE name = 'Adidas'),
  (SELECT id FROM categories WHERE name = 'Running'),
  1499000,
  35,
  '["38", "39", "40", "41", "42", "43", "44"]'::jsonb,
  '["Black", "White", "Grey"]'::jsonb,
  'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Ultra Boost Runner');

INSERT INTO products (name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured)
SELECT 
  'Classic Chuck Taylor',
  'Iconic canvas sneakers that never go out of style. Perfect for casual everyday wear.',
  (SELECT id FROM brands WHERE name = 'Converse'),
  (SELECT id FROM categories WHERE name = 'Casual'),
  799000,
  100,
  '["36", "37", "38", "39", "40", "41", "42", "43", "44"]'::jsonb,
  '["Black", "White", "Red", "Navy", "Green"]'::jsonb,
  'https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Classic Chuck Taylor');

INSERT INTO products (name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured)
SELECT 
  'Old Skool Pro',
  'Legendary skate shoes with durable construction and classic style.',
  (SELECT id FROM brands WHERE name = 'Vans'),
  (SELECT id FROM categories WHERE name = 'Sneakers'),
  899000,
  60,
  '["38", "39", "40", "41", "42", "43", "44"]'::jsonb,
  '["Black/White", "Navy", "Burgundy"]'::jsonb,
  'https://images.pexels.com/photos/1478442/pexels-photo-1478442.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1478442/pexels-photo-1478442.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Old Skool Pro');

INSERT INTO products (name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured)
SELECT 
  'RS-X Tech',
  'Bold and futuristic sneakers combining retro design with modern comfort.',
  (SELECT id FROM brands WHERE name = 'Puma'),
  (SELECT id FROM categories WHERE name = 'Sneakers'),
  1099000,
  45,
  '["38", "39", "40", "41", "42", "43", "44", "45"]'::jsonb,
  '["Black", "White", "Blue/Red", "Multicolor"]'::jsonb,
  'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'RS-X Tech');

INSERT INTO products (name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured)
SELECT 
  '574 Classic',
  'Timeless retro-inspired sneakers with superior comfort and style.',
  (SELECT id FROM brands WHERE name = 'New Balance'),
  (SELECT id FROM categories WHERE name = 'Casual'),
  1199000,
  40,
  '["38", "39", "40", "41", "42", "43", "44"]'::jsonb,
  '["Grey", "Navy", "Burgundy", "Green"]'::jsonb,
  'https://images.pexels.com/photos/2529147/pexels-photo-2529147.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/2529147/pexels-photo-2529147.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = '574 Classic');