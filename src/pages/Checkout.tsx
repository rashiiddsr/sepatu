import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { CartItemWithProduct } from '../types/database';
import { CreditCard, Truck, MapPin } from 'lucide-react';
import { api } from '../lib/api';

export default function Checkout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState('regular');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      setShippingAddress(profile.address || '');
      setShippingCity(profile.city || '');
      setShippingPostalCode(profile.postal_code || '');
    }

    fetchCartItems();
  }, [user, profile]);

  const fetchCartItems = async () => {
    const data = await api.getCartItems();
    if (data.length === 0) {
      navigate('/cart');
      return;
    }
    setCartItems(data);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  );

  const shippingCost = shippingMethod === 'express' ? 50000 : 20000;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    try {
      await api.createOrder({
        order_number: orderNumber,
        total_amount: total,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode,
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
        notes,
        status: 'pending',
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.products?.price || 0,
        })),
      });

      await api.clearCart();

      alert('Order placed successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="w-5 h-5 text-slate-900" />
                  <h2 className="text-xl font-bold text-slate-900">Shipping Address</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Street Address
                    </label>
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="Enter your full address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <Truck className="w-5 h-5 text-slate-900" />
                  <h2 className="text-xl font-bold text-slate-900">Shipping Method</h2>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 border-2 border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="shipping"
                        value="regular"
                        checked={shippingMethod === 'regular'}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <p className="font-medium text-slate-900">Regular Shipping</p>
                        <p className="text-sm text-slate-600">5-7 business days</p>
                      </div>
                    </div>
                    <span className="font-medium text-slate-900">Rp 20,000</span>
                  </label>

                  <label className="flex items-center justify-between p-4 border-2 border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="shipping"
                        value="express"
                        checked={shippingMethod === 'express'}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <p className="font-medium text-slate-900">Express Shipping</p>
                        <p className="text-sm text-slate-600">1-2 business days</p>
                      </div>
                    </div>
                    <span className="font-medium text-slate-900">Rp 50,000</span>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-5 h-5 text-slate-900" />
                  <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payment Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span>Rp {shippingCost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-slate-900">
                      <span>Total</span>
                      <span>Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
