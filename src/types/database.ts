export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  role: 'customer' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  brand_id: string | null;
  category_id: string | null;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  image_url: string | null;
  images: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_method: string;
  shipping_cost: number;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  size: string;
  color: string;
  price: number;
  created_at: string;
}

export interface ProductWithDetails extends Product {
  brands?: Brand | null;
  categories?: Category | null;
  tags?: Tag[];
  tag_ids?: string[];
}

export interface CartItemWithProduct extends CartItem {
  products?: Product;
}

export interface WishlistItemWithProduct extends Wishlist {
  products?: Product;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { products?: Product })[];
}
