import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ProductWithDetails, Category } from '../types/database';
import { ArrowRight, Heart, ShoppingCart, Sparkles, Star, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { api } from '../lib/api';

export default function Home() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { refreshCounts } = useShop();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = products.slice(0, 6);

  const addToWishlist = async (productId: string) => {
    if (!user) {
      alert('Please sign in to add items to wishlist');
      return;
    }

    try {
      await api.addWishlistItem(productId);
      await refreshCounts();
      alert('Added to wishlist!');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already')) {
        alert('Item already in wishlist');
      } else {
        alert('Failed to add to wishlist');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>New drop: Fall Street Essentials</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Temukan sepatu terbaik untuk gaya dan performa Anda
              </h1>
              <p className="text-lg text-slate-300 mb-8">
                Koleksi pilihan dari brand ternama, dengan kurasi yang fokus pada kenyamanan,
                durabilitas, dan look yang standout.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition"
                >
                  Belanja Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center border border-white/60 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
                >
                  Gabung Member
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <img
                  src="https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Sneakers hero"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="mt-4">
                  <p className="text-sm text-slate-300">Best seller</p>
                  <p className="font-semibold">Nike Air Max Pulse</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <img
                  src="https://images.pexels.com/photos/1456731/pexels-photo-1456731.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Running shoes"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="mt-4">
                  <p className="text-sm text-slate-300">Running pick</p>
                  <p className="font-semibold">Adidas Ultraboost Light</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Member exclusive</p>
                    <p className="text-xl font-semibold">Gratis ongkir & early access</p>
                  </div>
                  <Star className="w-8 h-8 text-amber-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Pengiriman Cepat</h3>
            <p className="text-slate-600">Proses pesanan kilat dengan tracking real-time.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Kurasi Premium</h3>
            <p className="text-slate-600">Brand ternama dengan kualitas terbaik untuk kamu.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Trending Drops</h3>
            <p className="text-slate-600">Update koleksi terbaru setiap minggu.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Kategori Favorit</h2>
            <p className="text-slate-600">Pilih kategori yang sesuai dengan kebutuhanmu.</p>
          </div>
          <Link to="/products" className="text-slate-900 font-semibold hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition"
            >
              <p className="text-sm text-slate-500">Category</p>
              <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
              <p className="text-sm text-slate-600 mt-2">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-100/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Produk Pilihan</h2>
              <p className="text-slate-600">Kurasi khusus untuk gaya harian dan sport.</p>
            </div>
            <Link to="/products" className="text-slate-900 font-semibold hover:underline">
              Jelajahi Produk
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="relative">
                    <Link to={`/products/${product.id}`}>
                      <img
                        src={
                          product.image_url ||
                          'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600'
                        }
                        alt={product.name}
                        className="w-full h-56 object-cover"
                      />
                    </Link>
                    <button
                      onClick={() => addToWishlist(product.id)}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-slate-50 transition"
                    >
                      <Heart className="w-5 h-5 text-slate-700" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-500">{product.brands?.name}</p>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {product.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link to={`/products/${product.id}`} className="block">
                      <h3 className="text-lg font-semibold text-slate-900 mt-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-slate-600 text-sm mt-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold text-slate-900">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                      <Link
                        to={`/products/${product.id}`}
                        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-900 hover:text-slate-700"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Detail</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-900 text-white rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Siap menemukan sepatu favoritmu?</h2>
            <p className="text-slate-300">Masuk ke katalog lengkap dengan filter yang detail.</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition"
          >
            Lihat Produk
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
