import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const data = await api.getAdminSummary();
    setStats(data);
  };

  const statCards = [
    {
      icon: Package,
      label: 'Total Products',
      value: stats.totalProducts,
      color: 'bg-blue-500',
    },
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: stats.totalOrders,
      color: 'bg-green-500',
    },
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'bg-purple-500',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Welcome to Solemates Admin Panel</h2>
        <p className="text-slate-600">
          Use the sidebar navigation to manage products, orders, users, and view detailed reports.
        </p>
      </div>
    </div>
  );
}
