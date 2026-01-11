import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { ProductWithDetails, Brand, Category } from '../types/database';
import { Search, Filter, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [productsRes, brandsRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, brands(*), categories(*)')
        .order('created_at', { ascending: false }),
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (brandsRes.data) setBrands(brandsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = !selectedBrand || product.brand_id === selectedBrand;
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;

    let matchesPrice = true;
    if (priceRange === 'low') matchesPrice = product.price < 1000000;
    else if (priceRange === 'mid') matchesPrice = product.price >= 1000000 && product.price < 1500000;
    else if (priceRange === 'high') matchesPrice = product.price >= 1500000;

    return matchesSearch && matchesBrand && matchesCategory && matchesPrice;
  });

  const addToWishlist = async (productId: string) => {
    if (!user) {
      alert('Please sign in to add items to wishlist');
      return;
    }

    const { error } = await supabase
      .from('wishlist')
      .insert({ user_id: user.id, product_id: productId });

    if (error) {
      if (error.code === '23505') {
        alert('Item already in wishlist');
      } else {
        alert('Failed to add to wishlist');
      }
    } else {
      alert('Added to wishlist!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Find Your Perfect Sole
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Premium footwear from the world's best brands
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for shoes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 text-lg focus:ring-2 focus:ring-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:w-64 space-y-6`}>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Brands</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === ''}
                    onChange={() => setSelectedBrand('')}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">All Brands</span>
                </label>
                {brands.map((brand) => (
                  <label key={brand.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === brand.id}
                      onChange={() => setSelectedBrand(brand.id)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-700">{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ''}
                    onChange={() => setSelectedCategory('')}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">All Categories</span>
                </label>
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category.id}
                      onChange={() => setSelectedCategory(category.id)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Price Range</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === 'all'}
                    onChange={() => setPriceRange('all')}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">All Prices</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === 'low'}
                    onChange={() => setPriceRange('low')}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">Under Rp 1,000,000</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === 'mid'}
                    onChange={() => setPriceRange('mid')}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">Rp 1,000,000 - 1,500,000</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === 'high'}
                    onChange={() => setPriceRange('high')}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">Above Rp 1,500,000</span>
                </label>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {filteredProducts.length} Products Found
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-lg transition">
                    <Link to={`/products/${product.id}`}>
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        <img
                          src={product.image_url || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {product.is_featured && (
                          <span className="absolute top-3 left-3 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-slate-500">
                          {product.brands?.name}
                        </span>
                      </div>
                      <Link to={`/products/${product.id}`}>
                        <h3 className="font-semibold text-slate-900 mb-2 hover:text-slate-700 transition">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-slate-900">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => addToWishlist(product.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Heart className="w-5 h-5 text-slate-600" />
                          </button>
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">No products found matching your filters</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
