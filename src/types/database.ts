export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          role: 'customer' | 'admin' | 'super_admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          role?: 'customer' | 'admin' | 'super_admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          role?: 'customer' | 'admin' | 'super_admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          price: number;
          stock?: number;
          sizes?: string[];
          colors?: string[];
          image_url?: string | null;
          images?: string[];
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          price?: number;
          stock?: number;
          sizes?: string[];
          colors?: string[];
          image_url?: string | null;
          images?: string[];
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          size: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity?: number;
          size: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          size?: string;
          color?: string;
          created_at?: string;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          shipping_address: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_method: string;
          shipping_cost?: number;
          tracking_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount?: number;
          shipping_address?: string;
          shipping_city?: string;
          shipping_postal_code?: string;
          shipping_method?: string;
          shipping_cost?: number;
          tracking_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          size: string;
          color: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity: number;
          size: string;
          color: string;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          size?: string;
          color?: string;
          price?: number;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Brand = Database['public']['Tables']['brands']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type Wishlist = Database['public']['Tables']['wishlist']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];

export interface ProductWithDetails extends Product {
  brands?: Brand;
  categories?: Category;
}

export interface CartItemWithProduct extends CartItem {
  products?: Product;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { products?: Product })[];
}
