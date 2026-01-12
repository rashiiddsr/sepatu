import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Tag,
  Layers,
  Store,
} from 'lucide-react';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/brands', icon: Store, label: 'Brands' },
    { path: '/admin/categories', icon: Layers, label: 'Categories' },
    { path: '/admin/tags', icon: Tag, label: 'Tags' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ];

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-40">
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-300">Admin Panel</p>
              <p className="text-lg font-semibold">Solemates Control Center</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              Lihat Toko
            </Link>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-slate-900 hover:bg-slate-100 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <aside className="w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-16">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-white text-slate-900'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 ml-64 mt-16 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
