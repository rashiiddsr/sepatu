import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ProductWithDetails, Brand, Category } from '../types/database';
import { Search, Filter, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { api } from '../lib/api';

export default function Products() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshCounts } = useShop();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    setSelectedCategory(categoryParam || '');
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, brandsData, categoriesData] = await Promise.all([
        api.getProducts(),
        api.getBrands(),
        api.getCategories(),
      ]);
      setProducts(productsData);
      setBrands(brandsData);
      setCategories(categoriesData);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore the Full Collection</h1>
            <p className="text-lg text-slate-300 mb-8">
              Cari sepatu terbaik untuk aktivitas harian, olahraga, dan gaya kamu.
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

          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Products ({filteredProducts.length})
                  </h2>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-slate-500">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
                        <div className="relative">
                          <Link to={`/products/${product.id}`}>
                            <img
                              src={
                                product.image_url ||
                                'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600'
                              }
                              alt={product.name}
                              className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
                            />
                          </Link>
                          <div className="absolute top-4 right-4 flex flex-col space-y-2">
                            <button
                              onClick={() => addToWishlist(product.id)}
                              className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition"
                            >
                              <Heart className="w-5 h-5 text-slate-700" />
                            </button>
                            <Link
                              to={`/products/${product.id}`}
                              className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition"
                            >
                              <ShoppingCart className="w-5 h-5 text-slate-700" />
                            </Link>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">{product.brands?.name}</span>
                            {product.is_featured && (
                              <span className="text-xs font-medium bg-slate-900 text-white px-2 py-1 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                          <Link to={`/products/${product.id}`} className="block">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 hover:text-slate-700 transition">
                              {product.name}
                            </h3>
                          </Link>
                          <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-slate-900">
                              Rp {product.price.toLocaleString('id-ID')}
                            </span>
                            <Link
                              to={`/products/${product.id}`}
                              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
