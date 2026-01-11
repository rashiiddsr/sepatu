import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { ProductWithDetails } from '../types/database';
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, brands(*), categories(*)')
      .eq('id', id!)
      .maybeSingle();

    if (data) {
      setProduct(data);
      if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0]);
      if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);
    }
    setLoading(false);
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .upsert({
        user_id: user.id,
        product_id: product!.id,
        quantity,
        size: selectedSize,
        color: selectedColor,
      }, {
        onConflict: 'user_id,product_id,size,color',
      });

    if (error) {
      alert('Failed to add to cart');
    } else {
      alert('Added to cart!');
    }
  };

  const addToWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const { error } = await supabase
      .from('wishlist')
      .insert({ user_id: user.id, product_id: product!.id });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Product not found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-sm font-medium text-slate-500">
                  {product.brands?.name}
                </span>
                <h1 className="text-4xl font-bold text-slate-900 mt-2">
                  {product.name}
                </h1>
                <p className="text-3xl font-bold text-slate-900 mt-4">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="py-4 border-y border-slate-200">
                <p className="text-slate-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes && product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition ${
                        selectedSize === size
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Select Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors && product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition ${
                        selectedColor === color
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border-2 border-slate-300 rounded-lg hover:border-slate-400 transition font-medium"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 border-2 border-slate-300 rounded-lg hover:border-slate-400 transition font-medium"
                  >
                    +
                  </button>
                  <span className="text-sm text-slate-500 ml-4">
                    {product.stock} in stock
                  </span>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={addToCart}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-medium hover:bg-slate-800 transition flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={addToWishlist}
                  className="px-6 py-4 border-2 border-slate-900 text-slate-900 rounded-xl font-medium hover:bg-slate-50 transition"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Category</span>
                  <span className="font-medium text-slate-900">{product.categories?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Brand</span>
                  <span className="font-medium text-slate-900">{product.brands?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Stock</span>
                  <span className="font-medium text-slate-900">{product.stock} units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
