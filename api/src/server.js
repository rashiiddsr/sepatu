const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const { loadStore, updateStore, now, createId } = require('./store');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const router = express.Router();
const port = Number(process.env.PORT || 3001);

const parseOrigins = () =>
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = parseOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'solemates-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

const ok = (res, data) => res.json({ data });
const fail = (res, status, message) => res.status(status).json({ error: message });

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    fail(res, 401, 'Unauthorized');
    return;
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  const store = await loadStore();
  const user = store.users.find((entry) => entry.id === req.session.userId);
  const profile = store.profiles.find((entry) => entry.id === user?.profile_id);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    fail(res, 403, 'Forbidden');
    return;
  }
  next();
};

const withProductDetails = (store, product) => ({
  ...product,
  brands: store.brands.find((brand) => brand.id === product.brand_id) || null,
  categories: store.categories.find((category) => category.id === product.category_id) || null,
});

const withCartDetails = (store, item) => ({
  ...item,
  products: store.products.find((product) => product.id === item.product_id) || null,
});

const withOrderDetails = (store, order) => ({
  ...order,
  order_items: store.order_items
    .filter((item) => item.order_id === order.id)
    .map((item) => ({
      ...item,
      products: store.products.find((product) => product.id === item.product_id) || null,
    })),
});

router.get('/auth/session', async (req, res) => {
  if (!req.session.userId) {
    ok(res, null);
    return;
  }
  const store = await loadStore();
  const user = store.users.find((entry) => entry.id === req.session.userId);
  const profile = store.profiles.find((entry) => entry.id === user?.profile_id);
  if (!user || !profile) {
    ok(res, null);
    return;
  }
  ok(res, {
    user: { id: user.id, email: user.email },
    profile,
  });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    fail(res, 400, 'Email and password are required');
    return;
  }
  const store = await loadStore();
  const user = store.users.find(
    (entry) => entry.email.toLowerCase() === String(email).toLowerCase()
  );
  if (!user || user.password !== password) {
    fail(res, 401, 'Invalid credentials');
    return;
  }
  const profile = store.profiles.find((entry) => entry.id === user.profile_id);
  req.session.userId = user.id;
  ok(res, {
    user: { id: user.id, email: user.email },
    profile,
  });
});

router.post('/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body || {};
  if (!email || !password || !full_name) {
    fail(res, 400, 'Email, password, and full name are required');
    return;
  }
  const result = await updateStore((store) => {
    const existing = store.users.find(
      (entry) => entry.email.toLowerCase() === String(email).toLowerCase()
    );
    if (existing) {
      return { error: 'Email already registered' };
    }
    const profileId = createId();
    const userId = createId();
    const profile = {
      id: profileId,
      full_name,
      phone: null,
      address: null,
      city: null,
      postal_code: null,
      role: 'customer',
      created_at: now(),
      updated_at: now(),
    };
    const user = {
      id: userId,
      email,
      password,
      profile_id: profileId,
    };
    store.profiles.push(profile);
    store.users.push(user);
    return { user, profile };
  });

  if (result?.error) {
    fail(res, 400, result.error);
    return;
  }

  req.session.userId = result.user.id;
  ok(res, {
    user: { id: result.user.id, email: result.user.email },
    profile: result.profile,
  });
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    ok(res, { message: 'Logged out' });
  });
});

router.get('/profile', requireAuth, async (req, res) => {
  const store = await loadStore();
  const user = store.users.find((entry) => entry.id === req.session.userId);
  const profile = store.profiles.find((entry) => entry.id === user?.profile_id);
  if (!profile) {
    fail(res, 404, 'Profile not found');
    return;
  }
  ok(res, profile);
});

router.put('/profile', requireAuth, async (req, res) => {
  const fields = ['full_name', 'phone', 'address', 'city', 'postal_code'];
  const payload = req.body || {};
  const updated = await updateStore((store) => {
    const user = store.users.find((entry) => entry.id === req.session.userId);
    const profile = store.profiles.find((entry) => entry.id === user?.profile_id);
    if (!profile) {
      return null;
    }
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        profile[field] = payload[field];
      }
    });
    profile.updated_at = now();
    return profile;
  });

  if (!updated) {
    fail(res, 404, 'Profile not found');
    return;
  }
  ok(res, true);
});

router.get('/brands', async (_req, res) => {
  const store = await loadStore();
  ok(res, store.brands);
});

router.get('/categories', async (_req, res) => {
  const store = await loadStore();
  ok(res, store.categories);
});

router.get('/products', async (req, res) => {
  const store = await loadStore();
  const { id } = req.query;
  if (id) {
    const product = store.products.find((entry) => entry.id === id);
    ok(res, product ? withProductDetails(store, product) : null);
    return;
  }
  ok(res, store.products.map((product) => withProductDetails(store, product)));
});

router.post('/products', async (req, res) => {
  const payload = req.body || {};
  if (!payload.name || typeof payload.price !== 'number') {
    fail(res, 400, 'Product name and price are required');
    return;
  }
  const created = await updateStore((store) => {
    const product = {
      id: createId(),
      name: payload.name,
      description: payload.description || null,
      brand_id: payload.brand_id || null,
      category_id: payload.category_id || null,
      price: payload.price,
      stock: payload.stock ?? 0,
      sizes: Array.isArray(payload.sizes) ? payload.sizes : [],
      colors: Array.isArray(payload.colors) ? payload.colors : [],
      image_url: payload.image_url || null,
      images: Array.isArray(payload.images) ? payload.images : [],
      is_featured: Boolean(payload.is_featured),
      created_at: now(),
      updated_at: now(),
    };
    store.products.push(product);
    return product;
  });
  ok(res, { id: created.id });
});

router.put('/products', async (req, res) => {
  const payload = req.body || {};
  if (!payload.id) {
    fail(res, 400, 'Product id is required');
    return;
  }
  const updated = await updateStore((store) => {
    const product = store.products.find((entry) => entry.id === payload.id);
    if (!product) {
      return null;
    }
    Object.assign(product, {
      name: payload.name ?? product.name,
      description: payload.description ?? product.description,
      brand_id: payload.brand_id ?? product.brand_id,
      category_id: payload.category_id ?? product.category_id,
      price: payload.price ?? product.price,
      stock: payload.stock ?? product.stock,
      sizes: Array.isArray(payload.sizes) ? payload.sizes : product.sizes,
      colors: Array.isArray(payload.colors) ? payload.colors : product.colors,
      image_url: payload.image_url ?? product.image_url,
      images: Array.isArray(payload.images) ? payload.images : product.images,
      is_featured:
        typeof payload.is_featured === 'boolean' ? payload.is_featured : product.is_featured,
      updated_at: now(),
    });
    return product;
  });

  if (!updated) {
    fail(res, 404, 'Product not found');
    return;
  }
  ok(res, true);
});

router.delete('/products', async (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    fail(res, 400, 'Product id is required');
    return;
  }
  const removed = await updateStore((store) => {
    const index = store.products.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return false;
    }
    store.products.splice(index, 1);
    store.cart_items = store.cart_items.filter((entry) => entry.product_id !== id);
    store.wishlist_items = store.wishlist_items.filter((entry) => entry.product_id !== id);
    store.order_items = store.order_items.map((entry) =>
      entry.product_id === id ? { ...entry, product_id: null } : entry
    );
    return true;
  });
  if (!removed) {
    fail(res, 404, 'Product not found');
    return;
  }
  ok(res, true);
});

router.get('/cart', requireAuth, async (req, res) => {
  const store = await loadStore();
  const items = store.cart_items
    .filter((entry) => entry.user_id === req.session.userId)
    .map((item) => withCartDetails(store, item));
  ok(res, items);
});

router.post('/cart', requireAuth, async (req, res) => {
  const { product_id, quantity, size, color } = req.body || {};
  if (!product_id || !quantity || !size || !color) {
    fail(res, 400, 'Product, quantity, size, and color are required');
    return;
  }
  const created = await updateStore((store) => {
    const product = store.products.find((entry) => entry.id === product_id);
    if (!product) {
      return { error: 'Product not found' };
    }
    const existing = store.cart_items.find(
      (entry) =>
        entry.user_id === req.session.userId &&
        entry.product_id === product_id &&
        entry.size === size &&
        entry.color === color
    );
    if (existing) {
      existing.quantity += quantity;
      return existing;
    }
    const item = {
      id: createId(),
      user_id: req.session.userId,
      product_id,
      quantity,
      size,
      color,
      created_at: now(),
    };
    store.cart_items.push(item);
    return item;
  });

  if (created?.error) {
    fail(res, 404, created.error);
    return;
  }
  ok(res, true);
});

router.put('/cart', requireAuth, async (req, res) => {
  const { id, quantity } = req.body || {};
  if (!id || typeof quantity !== 'number') {
    fail(res, 400, 'Cart item id and quantity are required');
    return;
  }
  const updated = await updateStore((store) => {
    const item = store.cart_items.find(
      (entry) => entry.id === id && entry.user_id === req.session.userId
    );
    if (!item) {
      return null;
    }
    item.quantity = Math.max(1, quantity);
    return item;
  });
  if (!updated) {
    fail(res, 404, 'Cart item not found');
    return;
  }
  ok(res, true);
});

router.delete('/cart', requireAuth, async (req, res) => {
  const { id, clear_all } = req.body || {};
  const removed = await updateStore((store) => {
    if (clear_all) {
      store.cart_items = store.cart_items.filter(
        (entry) => entry.user_id !== req.session.userId
      );
      return true;
    }
    const index = store.cart_items.findIndex(
      (entry) => entry.id === id && entry.user_id === req.session.userId
    );
    if (index === -1) {
      return false;
    }
    store.cart_items.splice(index, 1);
    return true;
  });
  if (!removed) {
    fail(res, 404, 'Cart item not found');
    return;
  }
  ok(res, true);
});

router.get('/wishlist', requireAuth, async (req, res) => {
  const store = await loadStore();
  const items = store.wishlist_items
    .filter((entry) => entry.user_id === req.session.userId)
    .map((item) => ({
      ...item,
      products: store.products.find((product) => product.id === item.product_id) || null,
    }));
  ok(res, items);
});

router.post('/wishlist', requireAuth, async (req, res) => {
  const { product_id } = req.body || {};
  if (!product_id) {
    fail(res, 400, 'Product id is required');
    return;
  }
  const created = await updateStore((store) => {
    const product = store.products.find((entry) => entry.id === product_id);
    if (!product) {
      return { error: 'Product not found' };
    }
    const existing = store.wishlist_items.find(
      (entry) => entry.user_id === req.session.userId && entry.product_id === product_id
    );
    if (existing) {
      return { error: 'Item already in wishlist' };
    }
    const item = {
      id: createId(),
      user_id: req.session.userId,
      product_id,
      created_at: now(),
    };
    store.wishlist_items.push(item);
    return item;
  });
  if (created?.error) {
    fail(res, 400, created.error);
    return;
  }
  ok(res, true);
});

router.delete('/wishlist', requireAuth, async (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    fail(res, 400, 'Wishlist id is required');
    return;
  }
  const removed = await updateStore((store) => {
    const index = store.wishlist_items.findIndex(
      (entry) => entry.id === id && entry.user_id === req.session.userId
    );
    if (index === -1) {
      return false;
    }
    store.wishlist_items.splice(index, 1);
    return true;
  });
  if (!removed) {
    fail(res, 404, 'Wishlist item not found');
    return;
  }
  ok(res, true);
});

router.get('/orders', requireAuth, async (req, res) => {
  const store = await loadStore();
  const user = store.users.find((entry) => entry.id === req.session.userId);
  const profile = store.profiles.find((entry) => entry.id === user?.profile_id);
  const orders = store.orders.filter((order) =>
    profile?.role === 'admin' || profile?.role === 'super_admin'
      ? true
      : order.user_id === req.session.userId
  );
  ok(res, orders.map((order) => withOrderDetails(store, order)));
});

router.post('/orders', requireAuth, async (req, res) => {
  const payload = req.body || {};
  if (!payload.order_number || !Array.isArray(payload.items)) {
    fail(res, 400, 'Order number and items are required');
    return;
  }
  const created = await updateStore((store) => {
    const orderId = createId();
    const order = {
      id: orderId,
      user_id: req.session.userId,
      order_number: payload.order_number,
      status: payload.status || 'pending',
      total_amount: payload.total_amount || 0,
      shipping_address: payload.shipping_address || '',
      shipping_city: payload.shipping_city || '',
      shipping_postal_code: payload.shipping_postal_code || '',
      shipping_method: payload.shipping_method || '',
      shipping_cost: payload.shipping_cost || 0,
      tracking_number: payload.tracking_number || null,
      notes: payload.notes || null,
      created_at: now(),
      updated_at: now(),
    };
    store.orders.push(order);
    payload.items.forEach((item) => {
      store.order_items.push({
        id: createId(),
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price,
        created_at: now(),
      });
    });
    store.cart_items = store.cart_items.filter((entry) => entry.user_id !== req.session.userId);
    return order;
  });
  ok(res, { id: created.id });
});

router.put('/orders', requireAuth, requireAdmin, async (req, res) => {
  const { id, status, tracking_number } = req.body || {};
  if (!id) {
    fail(res, 400, 'Order id is required');
    return;
  }
  const updated = await updateStore((store) => {
    const order = store.orders.find((entry) => entry.id === id);
    if (!order) {
      return null;
    }
    if (status) {
      order.status = status;
    }
    if (tracking_number !== undefined) {
      order.tracking_number = tracking_number;
    }
    order.updated_at = now();
    return order;
  });
  if (!updated) {
    fail(res, 404, 'Order not found');
    return;
  }
  ok(res, true);
});

router.get('/admin/summary', requireAuth, requireAdmin, async (_req, res) => {
  const store = await loadStore();
  const totalRevenue = store.orders.reduce((sum, order) => sum + order.total_amount, 0);
  ok(res, {
    totalProducts: store.products.length,
    totalOrders: store.orders.length,
    totalUsers: store.profiles.length,
    totalRevenue,
  });
});

router.get('/admin/users', requireAuth, requireAdmin, async (_req, res) => {
  const store = await loadStore();
  ok(res, store.profiles);
});

router.put('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const { id, role } = req.body || {};
  if (!id || !role) {
    fail(res, 400, 'User id and role are required');
    return;
  }
  const updated = await updateStore((store) => {
    const profile = store.profiles.find((entry) => entry.id === id);
    if (!profile) {
      return null;
    }
    profile.role = role;
    profile.updated_at = now();
    return profile;
  });
  if (!updated) {
    fail(res, 404, 'User not found');
    return;
  }
  ok(res, true);
});

router.get('/admin/reports', requireAuth, requireAdmin, async (_req, res) => {
  const store = await loadStore();
  const totalRevenue = store.orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = store.orders.length;
  const totalProducts = store.products.length;
  const totalUsers = store.profiles.length;

  const revenueByMonth = store.orders.reduce((acc, order) => {
    const month = order.created_at.slice(0, 7);
    acc[month] = (acc[month] || 0) + order.total_amount;
    return acc;
  }, {});

  const productSales = store.order_items.reduce((acc, item) => {
    if (!item.product_id) {
      return acc;
    }
    acc[item.product_id] = acc[item.product_id] || { sales: 0, revenue: 0 };
    acc[item.product_id].sales += item.quantity;
    acc[item.product_id].revenue += item.price * item.quantity;
    return acc;
  }, {});

  const topProducts = Object.entries(productSales)
    .map(([productId, stats]) => {
      const product = store.products.find((entry) => entry.id === productId);
      return {
        name: product?.name || 'Unknown',
        sales: stats.sales,
        revenue: stats.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentOrders = [...store.orders]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((order) => ({
      order_number: order.order_number,
      total_amount: order.total_amount,
      created_at: order.created_at,
    }));

  ok(res, {
    totalRevenue,
    totalOrders,
    totalProducts,
    totalUsers,
    revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    })),
    topProducts,
    recentOrders,
  });
});

app.use('/api', router);

app.use((_req, res) => {
  fail(res, 404, 'Not found');
});

app.listen(port, () => {
  console.log(`Solemates API running on port ${port}`);
});
