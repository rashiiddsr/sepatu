import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface WishlistItem {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    description: string | null;
    stock: number;
    brands?: { name: string };
  };
}

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, products(*, brands(name))')
      .eq('user_id', user!.id);

    if (data) setWishlistItems(data as unknown as WishlistItem[]);
    setLoading(false);
  };

  const removeFromWishlist = async (itemId: string) => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', itemId);

    if (!error) {
      fetchWishlist();
    }
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
          <p className="text-slate-600 mb-6">Save your favorite items here!</p>
          <Link
            to="/"
            className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Wishlist</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
              <Link to={`/products/${item.product_id}`}>
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={item.products.image_url || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={item.products.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              </Link>
              <div className="p-4">
                <div className="mb-2">
                  <span className="text-xs font-medium text-slate-500">
                    {item.products.brands?.name}
                  </span>
                </div>
                <Link to={`/products/${item.product_id}`}>
                  <h3 className="font-semibold text-slate-900 mb-2 hover:text-slate-700 transition">
                    {item.products.name}
                  </h3>
                </Link>
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {item.products.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-slate-900">
                    Rp {item.products.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-center space-x-2 text-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-2 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition"
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
