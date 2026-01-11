import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  LogOut,
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
  }, [isAdmin]);

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
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
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
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-64 mt-16 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
