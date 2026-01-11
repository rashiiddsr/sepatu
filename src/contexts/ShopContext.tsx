import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface ShopContextType {
  cartCount: number;
  wishlistCount: number;
  refreshCounts: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const refreshCounts = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    try {
      const [cartItems, wishlistItems] = await Promise.all([
        api.getCartItems(),
        api.getWishlist(),
      ]);
      const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(cartTotal);
      setWishlistCount(wishlistItems.length);
    } catch (error) {
      setCartCount(0);
      setWishlistCount(0);
    }
  }, [user]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  return (
    <ShopContext.Provider value={{ cartCount, wishlistCount, refreshCounts }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
