import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CartItemWithProduct } from '../types/database';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCartItems();
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const data = await api.getCartItems();
      setCartItems(data);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    await api.updateCartItem(itemId, newQuantity);
    fetchCartItems();
  };

  const removeItem = async (itemId: string) => {
    await api.removeCartItem(itemId);
    fetchCartItems();
  };

  const total = cartItems.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">Add some shoes to get started!</p>
          <Link
            to="/"
            className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex gap-6">
                  <img
                    src={item.products?.image_url || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=200'}
                    alt={item.products?.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.products?.name}
                        </h3>
                        <p className="text-slate-600 text-sm mt-1">
                          Size: {item.size} | Color: {item.color}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 border-2 border-slate-300 rounded-lg hover:border-slate-400 transition"
                        >
                          <Minus className="w-4 h-4 mx-auto" />
                        </button>
                        <span className="text-lg font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 border-2 border-slate-300 rounded-lg hover:border-slate-400 transition"
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        Rp {((item.products?.price || 0) * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition text-center"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/"
                className="block w-full text-center text-slate-600 hover:text-slate-900 mt-4"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
