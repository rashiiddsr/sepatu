import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { WishlistItemWithProduct } from '../types/database';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const data = await api.getWishlist();
      setWishlistItems(data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    await api.removeWishlistItem(itemId);
    fetchWishlist();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
          <p className="text-slate-600 mb-6">Save your favorite shoes here!</p>
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
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Wishlist</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Link to={`/product/${item.product_id}`}>
                <img
                  src={item.products?.image_url || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={item.products?.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {item.products?.name}
                </h3>
                <p className="text-xl font-bold text-slate-900 mb-4">
                  Rp {item.products?.price.toLocaleString('id-ID')}
                </p>
                <div className="flex space-x-3">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>View</span>
                  </Link>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
