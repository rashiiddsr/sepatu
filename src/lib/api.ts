import type {
  Brand,
  CartItemWithProduct,
  Category,
  OrderWithItems,
  ProductWithDetails,
  Profile,
  WishlistItemWithProduct,
} from '../types/database';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthSession {
  user: AuthUser;
  profile: Profile;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.error || 'Request failed';
    throw new Error(message);
  }

  return payload.data as T;
}

export const api = {
  getSession: () => apiFetch<AuthSession | null>('/auth/session'),
  signIn: (email: string, password: string) =>
    apiFetch<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signUp: (email: string, password: string, fullName: string) =>
    apiFetch<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),
  signOut: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
  getProfile: () => apiFetch<Profile>('/profile'),
  updateProfile: (profile: Partial<Profile>) =>
    apiFetch<boolean>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  getBrands: () => apiFetch<Brand[]>('/brands'),
  getCategories: () => apiFetch<Category[]>('/categories'),
  getProducts: () => apiFetch<ProductWithDetails[]>('/products'),
  getProduct: (id: string) =>
    apiFetch<ProductWithDetails | null>(`/products?id=${encodeURIComponent(id)}`),
  createProduct: (payload: Partial<ProductWithDetails>) =>
    apiFetch<{ id: string }>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (payload: Partial<ProductWithDetails>) =>
    apiFetch<boolean>('/products', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: string) =>
    apiFetch<boolean>('/products', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
  getCartItems: () => apiFetch<CartItemWithProduct[]>('/cart'),
  addCartItem: (payload: {
    product_id: string;
    quantity: number;
    size: string;
    color: string;
  }) =>
    apiFetch<boolean>('/cart', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCartItem: (id: string, quantity: number) =>
    apiFetch<boolean>('/cart', {
      method: 'PUT',
      body: JSON.stringify({ id, quantity }),
    }),
  removeCartItem: (id: string) =>
    apiFetch<boolean>('/cart', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
  clearCart: () =>
    apiFetch<boolean>('/cart', {
      method: 'DELETE',
      body: JSON.stringify({ clear_all: true }),
    }),
  getWishlist: () => apiFetch<WishlistItemWithProduct[]>('/wishlist'),
  addWishlistItem: (productId: string) =>
    apiFetch<boolean>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),
  removeWishlistItem: (id: string) =>
    apiFetch<boolean>('/wishlist', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
  getOrders: () => apiFetch<OrderWithItems[]>('/orders'),
  createOrder: (payload: {
    order_number: string;
    total_amount: number;
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_method: string;
    shipping_cost: number;
    notes: string;
    status: string;
    items: Array<{
      product_id: string;
      quantity: number;
      size: string;
      color: string;
      price: number;
    }>;
  }) =>
    apiFetch<{ id: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateOrder: (payload: { id: string; status?: string; tracking_number?: string }) =>
    apiFetch<boolean>('/orders', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getAdminSummary: () =>
    apiFetch<{ totalProducts: number; totalOrders: number; totalUsers: number; totalRevenue: number }>(
      '/admin/summary'
    ),
  getAdminUsers: () => apiFetch<Profile[]>('/admin/users'),
  updateAdminUserRole: (id: string, role: Profile['role']) =>
    apiFetch<boolean>('/admin/users', {
      method: 'PUT',
      body: JSON.stringify({ id, role }),
    }),
  getAdminReports: () =>
    apiFetch<{
      totalRevenue: number;
      totalOrders: number;
      totalProducts: number;
      totalUsers: number;
      revenueByMonth: Array<{ month: string; revenue: number }>;
      topProducts: Array<{ name: string; sales: number; revenue: number }>;
      recentOrders: Array<{ order_number: string; total_amount: number; created_at: string }>;
    }>('/admin/reports'),
};
