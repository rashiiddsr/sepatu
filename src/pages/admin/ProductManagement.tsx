import { useState, useEffect, FormEvent } from 'react';
import type { ProductWithDetails, Brand, Category, Tag } from '../../types/database';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';

export default function ProductManagement() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUpload, setImageUpload] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand_id: '',
    category_id: '',
    tag_ids: [] as string[],
    price: 0,
    stock: 0,
    sizes: '38,39,40,41,42,43,44',
    colors: 'Black,White',
    image_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [productsData, brandsData, categoriesData, tagsData] = await Promise.all([
      api.getProducts(),
      api.getBrands(),
      api.getCategories(),
      api.getTags(),
    ]);

    setProducts(productsData);
    setBrands(brandsData);
    setCategories(categoriesData);
    setTags(tagsData);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      brand_id: '',
      category_id: '',
      tag_ids: [],
      price: 0,
      stock: 0,
      sizes: '38,39,40,41,42,43,44',
      colors: 'Black,White',
      image_url: '',
    });
    setImageUpload(null);
    setShowModal(true);
  };

  const openEditModal = (product: ProductWithDetails) => {
    const imageUrl = product.image_url || '';
    const isUploadImage = imageUrl.startsWith('data:');
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      brand_id: product.brand_id || '',
      category_id: product.category_id || '',
      tag_ids: product.tags?.map((tag) => tag.id) || [],
      price: product.price,
      stock: product.stock,
      sizes: product.sizes.join(','),
      colors: product.colors.join(','),
      image_url: isUploadImage ? '' : imageUrl,
    });
    setImageUpload(isUploadImage ? imageUrl : null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const finalImageUrl = imageUpload || formData.image_url || null;

    const productData = {
      name: formData.name,
      description: formData.description,
      brand_id: formData.brand_id || null,
      category_id: formData.category_id || null,
      tag_ids: formData.tag_ids,
      price: formData.price,
      stock: formData.stock,
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
      image_url: finalImageUrl,
      images: imageUpload ? [imageUpload] : undefined,
    };

    try {
      if (editingProduct) {
        await api.updateProduct({ ...productData, id: editingProduct.id });
        alert('Product updated successfully!');
      } else {
        await api.createProduct(productData);
        alert('Product created successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(id);
      fetchData();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Product Management</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Tags</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.image_url || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-600">{product.description?.substring(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${product.stock < 10 ? 'text-red-600' : 'text-slate-900'}`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {product.tags && product.tags.length > 0 ? (
                        product.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No tags</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="" disabled>
                      Select Brand
                    </option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const checked = formData.tag_ids.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        className={`flex items-center space-x-2 px-3 py-2 border rounded-full text-sm cursor-pointer ${
                          checked ? 'border-slate-900 text-slate-900' : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? formData.tag_ids.filter((id) => id !== tag.id)
                              : [...formData.tag_ids, tag.id];
                            setFormData({ ...formData, tag_ids: next });
                          }}
                          className="text-slate-900 focus:ring-slate-900"
                        />
                        <span>{tag.name}</span>
                      </label>
                    );
                  })}
                  {tags.length === 0 && (
                    <p className="text-sm text-slate-500">No tags available. Add tags in admin first.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sizes</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="38,39,40,41"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Colors</label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Black,White"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Image Link
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_url: e.target.value });
                    if (e.target.value) {
                      setImageUpload(null);
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setImageUpload(null);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setImageUpload(reader.result as string);
                      setFormData((prev) => ({ ...prev, image_url: '' }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Anda bisa menggunakan link atau upload gambar langsung.
                </p>
              </div>

              {(imageUpload || formData.image_url) && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Preview</p>
                  <img
                    src={imageUpload || formData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
