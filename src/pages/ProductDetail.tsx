import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ProductWithDetails } from '../types/database';
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

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
    setLoading(true);
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getProduct(id);

      if (data) {
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        } else {
          setSelectedSize('');
        }
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        } else {
          setSelectedColor('');
        }
      } else {
        setProduct(null);
      }
    } catch (error) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) {
      alert('Product is not available');
      return;
    }

    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }

    try {
      await api.addCartItem({
        product_id: product.id,
        quantity,
        size: selectedSize,
        color: selectedColor,
      });
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  const addToWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) {
      alert('Product is not available');
      return;
    }

    try {
      await api.addWishlistItem(product.id);
      alert('Added to wishlist!');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already')) {
        alert('Item already in wishlist');
      } else {
        alert('Failed to add to wishlist');
      }
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
                  {product.description || 'No description available.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes && product.sizes.length > 0 ? (
                    product.sizes.map((size) => (
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
                    ))
                  ) : (
                    <button
                      type="button"
                      className="px-4 py-2 border-2 border-dashed rounded-lg text-slate-400"
                    >
                      No sizes available
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Select Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors && product.colors.length > 0 ? (
                    product.colors.map((color) => (
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
                    ))
                  ) : (
                    <button
                      type="button"
                      className="px-4 py-2 border-2 border-dashed rounded-lg text-slate-400"
                    >
                      No colors available
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border-2 border-slate-300 rounded-lg hover:border-slate-400 transition"
                  >
                    -
                  </button>
                  <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border-2 border-slate-300 rounded-lg hover:border-slate-400 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={addToCart}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-semibold hover:bg-slate-800 transition flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={addToWishlist}
                  className="px-6 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                >
                  <Heart className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">{product.categories?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Stock</p>
                  <p className="font-medium text-slate-900">{product.stock} available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
