import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react';

export default function Reports() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenueByMonth: [] as { month: string; revenue: number }[],
    topProducts: [] as { name: string; sales: number; revenue: number }[],
    recentOrders: [] as any[],
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const [ordersRes, productsRes, usersRes] = await Promise.all([
      supabase.from('orders').select('total_amount, created_at, order_items(product_id, quantity, price, products(name))'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    const orders = ordersRes.data || [];
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productName = item.products?.name || 'Unknown';
        const existing = productSales.get(productName) || { name: productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        productSales.set(productName, existing);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({ name: p.name, sales: p.quantity, revenue: p.revenue }));

    setStats({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: productsRes.count || 0,
      totalUsers: usersRes.count || 0,
      revenueByMonth: [],
      topProducts,
      recentOrders: orders.slice(0, 5),
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900">
            Rp {stats.totalRevenue.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-1">Total Products</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-1">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Top Selling Products</h2>
          {stats.topProducts.length > 0 ? (
            <div className="space-y-4">
              {stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">{product.sales} units sold</p>
                  </div>
                  <span className="font-bold text-slate-900">
                    Rp {product.revenue.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No sales data available</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Orders</h2>
          {stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Order #{order.order_number || 'N/A'}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(order.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
