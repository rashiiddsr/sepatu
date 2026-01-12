CREATE DATABASE IF NOT EXISTS solemates;
USE solemates;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  postal_code VARCHAR(20) DEFAULT NULL,
  role ENUM('customer','admin','super_admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_users FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS brands (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tags (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  brand_id CHAR(36) DEFAULT NULL,
  category_id CHAR(36) DEFAULT NULL,
  price DECIMAL(12,2) NOT NULL,
  stock INT DEFAULT 0,
  sizes JSON DEFAULT NULL,
  colors JSON DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  images JSON DEFAULT NULL,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_brands FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_categories FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_tags (
  product_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, tag_id),
  CONSTRAINT fk_product_tags_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_cart (user_id, product_id, size, color),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wishlist (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_wishlist (user_id, product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  order_number VARCHAR(60) NOT NULL,
  status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(120) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_method VARCHAR(50) NOT NULL,
  shipping_cost DECIMAL(12,2) NOT NULL,
  tracking_number VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) DEFAULT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO users (id, email, username, password_hash) VALUES
  ('s1111111-1111-1111-1111-111111111111', 'superadmin@gmail.com', 'superadmin', 'superadmin'),
  ('a1111111-1111-1111-1111-111111111111', 'admin@solemates.local', 'adminsolemates', 'admin123');

INSERT IGNORE INTO profiles (id, full_name, role) VALUES
  ('s1111111-1111-1111-1111-111111111111', 'Superadmin', 'super_admin'),
  ('a1111111-1111-1111-1111-111111111111', 'Admin Solemates', 'admin');

INSERT INTO brands (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Nike', 'Performance and lifestyle sneakers.'),
  ('22222222-2222-2222-2222-222222222222', 'Adidas', 'Classic and modern footwear.'),
  ('33333333-3333-3333-3333-333333333333', 'Puma', 'Sporty shoes with bold style.'),
  ('44444444-4444-4444-4444-444444444444', 'Converse', 'Timeless canvas classics.'),
  ('55555555-5555-5555-5555-555555555555', 'Vans', 'Skate-inspired sneakers.'),
  ('66666666-6666-6666-6666-666666666666', 'New Balance', 'Comfort-focused runners.');

INSERT INTO categories (id, name, description) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Running', 'Shoes built for running.'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Basketball', 'High support for court play.'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Casual', 'Everyday casual wear.'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Skate', 'Durable skate shoes.'),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Training', 'Cross-training footwear.'),
  ('aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Lifestyle', 'Street-ready styles.'),
  ('aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'Outdoor', 'Trail and outdoor shoes.'),
  ('aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Sandals', 'Comfortable sandals.');

INSERT INTO tags (id, name) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'Featured'),
  ('t2222222-2222-2222-2222-222222222222', 'Hot'),
  ('t3333333-3333-3333-3333-333333333333', 'Popular');

INSERT INTO products (id, name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured) VALUES
  ('p1111111-1111-1111-1111-111111111111', 'Nike Air Max Pulse', 'Lightweight cushioning for everyday comfort.', '11111111-1111-1111-1111-111111111111', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 1500000, 20, '["39","40","41","42"]', '["Black","White"]', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', '[]', 1),
  ('p2222222-2222-2222-2222-222222222222', 'Adidas Ultraboost Light', 'Responsive boost for daily runs.', '22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 1800000, 15, '["40","41","42","43"]', '["Black","Grey"]', 'https://images.pexels.com/photos/1456731/pexels-photo-1456731.jpeg?auto=compress&cs=tinysrgb&w=800', '[]', 1),
  ('p3333333-3333-3333-3333-333333333333', 'Puma RS-X Efekt', 'Chunky silhouette with bold design.', '33333333-3333-3333-3333-333333333333', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 1350000, 10, '["39","40","41","42"]', '["White","Blue"]', 'https://images.pexels.com/photos/2529150/pexels-photo-2529150.jpeg?auto=compress&cs=tinysrgb&w=800', '[]', 0),
  ('p4444444-4444-4444-4444-444444444444', 'Converse Chuck 70', 'Iconic canvas sneakers with a premium feel.', '44444444-4444-4444-4444-444444444444', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 950000, 25, '["38","39","40","41"]', '["Black","Cream"]', 'https://images.pexels.com/photos/2529147/pexels-photo-2529147.jpeg?auto=compress&cs=tinysrgb&w=800', '[]', 0),
  ('p5555555-5555-5555-5555-555555555555', 'Vans Old Skool', 'Classic skate shoes with suede accents.', '55555555-5555-5555-5555-555555555555', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 850000, 18, '["39","40","41","42"]', '["Black","White"]', 'https://images.pexels.com/photos/2529151/pexels-photo-2529151.jpeg?auto=compress&cs=tinysrgb&w=800', '[]', 0),
  ('p6666666-6666-6666-6666-666666666666', 'New Balance 327', 'Retro running-inspired sneakers.', '66666666-6666-6666-6666-666666666666', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 1400000, 12, '["39","40","41","42"]', '["Grey","Navy"]', 'https://images.pexels.com/photos/2529149/pexels-photo-2529149.jpeg?auto=compress&cs=tinysrgb&w=800', '[]', 0);

INSERT INTO product_tags (product_id, tag_id) VALUES
  ('p1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111'),
  ('p1111111-1111-1111-1111-111111111111', 't3333333-3333-3333-3333-333333333333'),
  ('p2222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222222');
