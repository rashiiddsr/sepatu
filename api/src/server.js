const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');
const { query, withTransaction } = require('./db');

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

const parseJsonValue = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const mapProductRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.product_id,
    name: row.product_name,
    description: row.product_description,
    brand_id: row.product_brand_id,
    category_id: row.product_category_id,
    price: Number(row.product_price),
    stock: row.product_stock,
    sizes: parseJsonValue(row.product_sizes, []),
    colors: parseJsonValue(row.product_colors, []),
    image_url: row.product_image_url,
    images: parseJsonValue(row.product_images, []),
    is_featured: Boolean(row.product_is_featured),
    created_at: row.product_created_at,
    updated_at: row.product_updated_at,
    tags: [],
    brands: row.brand_id
      ? {
          id: row.brand_id,
          name: row.brand_name,
          description: row.brand_description,
          logo_url: row.brand_logo_url,
          created_at: row.brand_created_at,
        }
      : null,
    categories: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          description: row.category_description,
          created_at: row.category_created_at,
        }
      : null,
  };
};

const mapTagRow = (row) =>
  row
    ? {
        id: row.tag_id,
        name: row.tag_name,
        created_at: row.tag_created_at,
      }
    : null;

const mapProfileRow = (row) =>
  row
    ? {
        id: row.id,
        username: row.username,
        full_name: row.full_name,
        phone: row.phone,
        address: row.address,
        city: row.city,
        postal_code: row.postal_code,
        role: row.role,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    : null;

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    fail(res, 401, 'Unauthorized');
    return;
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  const [rows] = await query('SELECT role FROM profiles WHERE id = ?', [req.session.userId]);
  const role = rows[0]?.role;
  if (!role || (role !== 'admin' && role !== 'super_admin')) {
    fail(res, 403, 'Forbidden');
    return;
  }
  next();
};

router.get('/auth/session', async (req, res) => {
  if (!req.session.userId) {
    ok(res, null);
    return;
  }
  const [rows] = await query(
    `SELECT u.id, u.email, u.username, p.full_name, p.phone, p.address, p.city, p.postal_code, p.role,
      p.created_at, p.updated_at
     FROM users u
     JOIN profiles p ON p.id = u.id
     WHERE u.id = ?`,
    [req.session.userId]
  );
  const user = rows[0];
  if (!user) {
    ok(res, null);
    return;
  }
  ok(res, {
    user: { id: user.id, email: user.email, username: user.username },
    profile: mapProfileRow(user),
  });
});

router.post('/auth/login', async (req, res) => {
  const { identifier, email, username, password } = req.body || {};
  const loginId = identifier || email || username;
  if (!loginId || !password) {
    fail(res, 400, 'Email/username and password are required');
    return;
  }
  const [rows] = await query(
    `SELECT u.id, u.email, u.username, u.password_hash, p.full_name, p.phone, p.address, p.city, p.postal_code,
      p.role, p.created_at, p.updated_at
     FROM users u
     JOIN profiles p ON p.id = u.id
     WHERE LOWER(u.email) = LOWER(?) OR LOWER(u.username) = LOWER(?)`,
    [loginId, loginId]
  );
  const user = rows[0];
  if (!user || user.password_hash !== password) {
    fail(res, 401, 'Invalid credentials');
    return;
  }
  req.session.userId = user.id;
  ok(res, {
    user: { id: user.id, email: user.email, username: user.username },
    profile: mapProfileRow(user),
  });
});

router.post('/auth/register', async (req, res) => {
  const { email, password, full_name, username } = req.body || {};
  if (!email || !password || !full_name || !username) {
    fail(res, 400, 'Email, username, password, and full name are required');
    return;
  }
  const [existing] = await query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)',
    [email, username]
  );
  if (existing.length > 0) {
    fail(res, 400, 'Email or username already registered');
    return;
  }

  const userId = randomUUID();
  await withTransaction(async (connection) => {
    await connection.query(
      'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)',
      [userId, email, username, password]
    );
    await connection.query(
      'INSERT INTO profiles (id, full_name, role) VALUES (?, ?, ?)',
      [userId, full_name, 'customer']
    );
  });

  req.session.userId = userId;
  ok(res, {
    user: { id: userId, email, username },
    profile: {
      id: userId,
      username,
      full_name,
      phone: null,
      address: null,
      city: null,
      postal_code: null,
      role: 'customer',
      created_at: null,
      updated_at: null,
    },
  });
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    ok(res, { message: 'Logged out' });
  });
});

router.get('/profile', requireAuth, async (req, res) => {
  const [rows] = await query(
    `SELECT p.id, u.username, p.full_name, p.phone, p.address, p.city, p.postal_code, p.role,
      p.created_at, p.updated_at
     FROM profiles p
     JOIN users u ON u.id = p.id
     WHERE p.id = ?`,
    [req.session.userId]
  );
  const profile = mapProfileRow(rows[0]);
  if (!profile) {
    fail(res, 404, 'Profile not found');
    return;
  }
  ok(res, profile);
});

router.put('/profile', requireAuth, async (req, res) => {
  const fields = ['full_name', 'phone', 'address', 'city', 'postal_code'];
  const payload = req.body || {};
  const updates = fields
    .filter((field) => Object.prototype.hasOwnProperty.call(payload, field))
    .map((field) => ({ field, value: payload[field] }));
  const username = Object.prototype.hasOwnProperty.call(payload, 'username')
    ? payload.username
    : undefined;

  if (username !== undefined) {
    if (!username) {
      fail(res, 400, 'Username is required');
      return;
    }
    const [existing] = await query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
      [username, req.session.userId]
    );
    if (existing.length > 0) {
      fail(res, 400, 'Username already in use');
      return;
    }
  }

  if (updates.length === 0 && username === undefined) {
    ok(res, true);
    return;
  }

  if (username !== undefined) {
    await query('UPDATE users SET username = ? WHERE id = ?', [username, req.session.userId]);
  }

  const setClause = updates.map((item) => `${item.field} = ?`).join(', ');
  const values = updates.map((item) => item.value);
  if (updates.length > 0) {
    const [result] = await query(
      `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, req.session.userId]
    );

    if (result.affectedRows === 0) {
      fail(res, 404, 'Profile not found');
      return;
    }
  }
  ok(res, true);
});

router.get('/brands', async (_req, res) => {
  const [rows] = await query('SELECT id, name, description, logo_url, created_at FROM brands');
  ok(res, rows);
});

router.get('/categories', async (_req, res) => {
  const [rows] = await query('SELECT id, name, description, created_at FROM categories');
  ok(res, rows);
});

router.get('/tags', async (_req, res) => {
  const [rows] = await query('SELECT id, name, created_at FROM tags');
  ok(res, rows);
});

router.get('/products', async (req, res) => {
  const { id } = req.query;
  const productSql = `SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.brand_id AS product_brand_id,
      p.category_id AS product_category_id,
      p.price AS product_price,
      p.stock AS product_stock,
      p.sizes AS product_sizes,
      p.colors AS product_colors,
      p.image_url AS product_image_url,
      p.images AS product_images,
      p.is_featured AS product_is_featured,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at,
      b.id AS brand_id,
      b.name AS brand_name,
      b.description AS brand_description,
      b.logo_url AS brand_logo_url,
      b.created_at AS brand_created_at,
      c.id AS category_id,
      c.name AS category_name,
      c.description AS category_description,
      c.created_at AS category_created_at
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id`;
  if (id) {
    const [rows] = await query(`${productSql} WHERE p.id = ?`, [id]);
    const product = rows.length ? mapProductRow(rows[0]) : null;
    if (!product) {
      ok(res, null);
      return;
    }
    const [tagRows] = await query(
      `SELECT pt.product_id, t.id AS tag_id, t.name AS tag_name, t.created_at AS tag_created_at
       FROM product_tags pt
       JOIN tags t ON pt.tag_id = t.id
       WHERE pt.product_id = ?`,
      [product.id]
    );
    product.tags = tagRows.map((row) => mapTagRow(row)).filter(Boolean);
    ok(res, product);
    return;
  }
  const [rows] = await query(productSql);
  const products = rows.map((row) => mapProductRow(row));
  const productIds = products.map((product) => product.id);
  if (productIds.length > 0) {
    const [tagRows] = await query(
      `SELECT pt.product_id, t.id AS tag_id, t.name AS tag_name, t.created_at AS tag_created_at
       FROM product_tags pt
       JOIN tags t ON pt.tag_id = t.id
       WHERE pt.product_id IN (?)`,
      [productIds]
    );
    const tagsByProduct = new Map();
    tagRows.forEach((row) => {
      const tag = mapTagRow(row);
      if (!tag) {
        return;
      }
      const list = tagsByProduct.get(row.product_id) || [];
      list.push(tag);
      tagsByProduct.set(row.product_id, list);
    });
    products.forEach((product) => {
      product.tags = tagsByProduct.get(product.id) || [];
    });
  }
  ok(res, products);
});

router.post('/products', async (req, res) => {
  const payload = req.body || {};
  if (!payload.name || typeof payload.price !== 'number') {
    fail(res, 400, 'Product name and price are required');
    return;
  }
  const productId = randomUUID();
  await withTransaction(async (connection) => {
    await connection.query(
      `INSERT INTO products
        (id, name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        payload.name,
        payload.description || null,
        payload.brand_id || null,
        payload.category_id || null,
        payload.price,
        payload.stock ?? 0,
        JSON.stringify(Array.isArray(payload.sizes) ? payload.sizes : []),
        JSON.stringify(Array.isArray(payload.colors) ? payload.colors : []),
        payload.image_url || null,
        JSON.stringify(Array.isArray(payload.images) ? payload.images : []),
        payload.is_featured ? 1 : 0,
      ]
    );
    if (Array.isArray(payload.tag_ids) && payload.tag_ids.length > 0) {
      const values = payload.tag_ids.map((tagId) => [productId, tagId]);
      await connection.query('INSERT INTO product_tags (product_id, tag_id) VALUES ?', [values]);
    }
  });
  ok(res, { id: productId });
});

router.put('/products', async (req, res) => {
  const payload = req.body || {};
  if (!payload.id) {
    fail(res, 400, 'Product id is required');
    return;
  }
  const updates = [];
  const values = [];
  const addUpdate = (field, value) => {
    updates.push(`${field} = ?`);
    values.push(value);
  };

  if (payload.name !== undefined) addUpdate('name', payload.name);
  if (payload.description !== undefined) addUpdate('description', payload.description);
  if (payload.brand_id !== undefined) addUpdate('brand_id', payload.brand_id);
  if (payload.category_id !== undefined) addUpdate('category_id', payload.category_id);
  if (payload.price !== undefined) addUpdate('price', payload.price);
  if (payload.stock !== undefined) addUpdate('stock', payload.stock);
  if (payload.sizes !== undefined)
    addUpdate('sizes', JSON.stringify(Array.isArray(payload.sizes) ? payload.sizes : []));
  if (payload.colors !== undefined)
    addUpdate('colors', JSON.stringify(Array.isArray(payload.colors) ? payload.colors : []));
  if (payload.image_url !== undefined) addUpdate('image_url', payload.image_url);
  if (payload.images !== undefined)
    addUpdate('images', JSON.stringify(Array.isArray(payload.images) ? payload.images : []));
  if (payload.is_featured !== undefined) addUpdate('is_featured', payload.is_featured ? 1 : 0);

  if (updates.length === 0 && !Array.isArray(payload.tag_ids)) {
    ok(res, true);
    return;
  }

  if (updates.length > 0) {
    const [result] = await query(
      `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      [...values, payload.id]
    );

    if (result.affectedRows === 0) {
      fail(res, 404, 'Product not found');
      return;
    }
  }
  if (Array.isArray(payload.tag_ids)) {
    if (updates.length === 0) {
      const [rows] = await query('SELECT id FROM products WHERE id = ?', [payload.id]);
      if (rows.length === 0) {
        fail(res, 404, 'Product not found');
        return;
      }
    }
    await withTransaction(async (connection) => {
      await connection.query('DELETE FROM product_tags WHERE product_id = ?', [payload.id]);
      if (payload.tag_ids.length > 0) {
        const values = payload.tag_ids.map((tagId) => [payload.id, tagId]);
        await connection.query('INSERT INTO product_tags (product_id, tag_id) VALUES ?', [values]);
      }
    });
  }
  ok(res, true);
});

router.delete('/products', async (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    fail(res, 400, 'Product id is required');
    return;
  }
  const [result] = await query('DELETE FROM products WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'Product not found');
    return;
  }
  ok(res, true);
});

router.get('/cart', requireAuth, async (req, res) => {
  const [rows] = await query(
    `SELECT
      ci.id,
      ci.user_id,
      ci.product_id AS item_product_id,
      ci.quantity,
      ci.size,
      ci.color,
      ci.created_at,
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.brand_id AS product_brand_id,
      p.category_id AS product_category_id,
      p.price AS product_price,
      p.stock AS product_stock,
      p.sizes AS product_sizes,
      p.colors AS product_colors,
      p.image_url AS product_image_url,
      p.images AS product_images,
      p.is_featured AS product_is_featured,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at,
      b.id AS brand_id,
      b.name AS brand_name,
      b.description AS brand_description,
      b.logo_url AS brand_logo_url,
      b.created_at AS brand_created_at,
      c.id AS category_id,
      c.name AS category_name,
      c.description AS category_description,
      c.created_at AS category_created_at
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ci.user_id = ?`,
    [req.session.userId]
  );
  const items = rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    product_id: row.item_product_id,
    quantity: row.quantity,
    size: row.size,
    color: row.color,
    created_at: row.created_at,
    products: mapProductRow(row),
  }));
  ok(res, items);
});

router.post('/cart', requireAuth, async (req, res) => {
  const { product_id, quantity, size, color } = req.body || {};
  if (!product_id || !quantity || !size || !color) {
    fail(res, 400, 'Product, quantity, size, and color are required');
    return;
  }
  const [products] = await query('SELECT id FROM products WHERE id = ?', [product_id]);
  if (products.length === 0) {
    fail(res, 404, 'Product not found');
    return;
  }

  const [existing] = await query(
    `SELECT id, quantity
     FROM cart_items
     WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
    [req.session.userId, product_id, size, color]
  );

  if (existing.length > 0) {
    await query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [
      quantity,
      existing[0].id,
    ]);
    ok(res, true);
    return;
  }

  await query(
    'INSERT INTO cart_items (id, user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), req.session.userId, product_id, quantity, size, color]
  );
  ok(res, true);
});

router.put('/cart', requireAuth, async (req, res) => {
  const { id, quantity } = req.body || {};
  if (!id || typeof quantity !== 'number') {
    fail(res, 400, 'Cart item id and quantity are required');
    return;
  }
  const [result] = await query(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
    [Math.max(1, quantity), id, req.session.userId]
  );
  if (result.affectedRows === 0) {
    fail(res, 404, 'Cart item not found');
    return;
  }
  ok(res, true);
});

router.delete('/cart', requireAuth, async (req, res) => {
  const { id, clear_all } = req.body || {};
  if (clear_all) {
    await query('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId]);
    ok(res, true);
    return;
  }
  const [result] = await query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [
    id,
    req.session.userId,
  ]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'Cart item not found');
    return;
  }
  ok(res, true);
});

router.get('/wishlist', requireAuth, async (req, res) => {
  const [rows] = await query(
    `SELECT
      w.id,
      w.user_id,
      w.product_id AS item_product_id,
      w.created_at,
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.brand_id AS product_brand_id,
      p.category_id AS product_category_id,
      p.price AS product_price,
      p.stock AS product_stock,
      p.sizes AS product_sizes,
      p.colors AS product_colors,
      p.image_url AS product_image_url,
      p.images AS product_images,
      p.is_featured AS product_is_featured,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at,
      b.id AS brand_id,
      b.name AS brand_name,
      b.description AS brand_description,
      b.logo_url AS brand_logo_url,
      b.created_at AS brand_created_at,
      c.id AS category_id,
      c.name AS category_name,
      c.description AS category_description,
      c.created_at AS category_created_at
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE w.user_id = ?`,
    [req.session.userId]
  );
  const items = rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    product_id: row.item_product_id,
    created_at: row.created_at,
    products: mapProductRow(row),
  }));
  ok(res, items);
});

router.post('/wishlist', requireAuth, async (req, res) => {
  const { product_id } = req.body || {};
  if (!product_id) {
    fail(res, 400, 'Product id is required');
    return;
  }
  const [products] = await query('SELECT id FROM products WHERE id = ?', [product_id]);
  if (products.length === 0) {
    fail(res, 404, 'Product not found');
    return;
  }
  const [existing] = await query(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
    [req.session.userId, product_id]
  );
  if (existing.length > 0) {
    fail(res, 400, 'Item already in wishlist');
    return;
  }
  await query('INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)', [
    randomUUID(),
    req.session.userId,
    product_id,
  ]);
  ok(res, true);
});

router.delete('/wishlist', requireAuth, async (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    fail(res, 400, 'Wishlist id is required');
    return;
  }
  const [result] = await query('DELETE FROM wishlist WHERE id = ? AND user_id = ?', [
    id,
    req.session.userId,
  ]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'Wishlist item not found');
    return;
  }
  ok(res, true);
});

router.get('/orders', requireAuth, async (req, res) => {
  const [roles] = await query('SELECT role FROM profiles WHERE id = ?', [req.session.userId]);
  const isAdmin = ['admin', 'super_admin'].includes(roles[0]?.role);
  const [orders] = await query(
    `SELECT * FROM orders ${isAdmin ? '' : 'WHERE user_id = ?'}`,
    isAdmin ? [] : [req.session.userId]
  );

  if (orders.length === 0) {
    ok(res, []);
    return;
  }

  const orderIds = orders.map((order) => order.id);
  const [items] = await query(
    `SELECT
      oi.id,
      oi.order_id,
      oi.product_id AS item_product_id,
      oi.quantity,
      oi.size,
      oi.color,
      oi.price,
      oi.created_at,
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.brand_id AS product_brand_id,
      p.category_id AS product_category_id,
      p.price AS product_price,
      p.stock AS product_stock,
      p.sizes AS product_sizes,
      p.colors AS product_colors,
      p.image_url AS product_image_url,
      p.images AS product_images,
      p.is_featured AS product_is_featured,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at,
      b.id AS brand_id,
      b.name AS brand_name,
      b.description AS brand_description,
      b.logo_url AS brand_logo_url,
      b.created_at AS brand_created_at,
      c.id AS category_id,
      c.name AS category_name,
      c.description AS category_description,
      c.created_at AS category_created_at
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE oi.order_id IN (?)`,
    [orderIds]
  );

  const itemsByOrder = items.reduce((acc, item) => {
    if (!acc[item.order_id]) {
      acc[item.order_id] = [];
    }
    acc[item.order_id].push({
      id: item.id,
      order_id: item.order_id,
      product_id: item.item_product_id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: Number(item.price),
      created_at: item.created_at,
      products: mapProductRow(item),
    });
    return acc;
  }, {});

  const result = orders.map((order) => ({
    ...order,
    total_amount: Number(order.total_amount),
    shipping_cost: Number(order.shipping_cost),
    order_items: itemsByOrder[order.id] || [],
  }));
  ok(res, result);
});

router.post('/orders', requireAuth, async (req, res) => {
  const payload = req.body || {};
  if (!payload.order_number || !Array.isArray(payload.items)) {
    fail(res, 400, 'Order number and items are required');
    return;
  }
  const orderId = randomUUID();
  await withTransaction(async (connection) => {
    await connection.query(
      `INSERT INTO orders
        (id, user_id, order_number, status, total_amount, shipping_address, shipping_city,
         shipping_postal_code, shipping_method, shipping_cost, tracking_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        req.session.userId,
        payload.order_number,
        payload.status || 'pending',
        payload.total_amount || 0,
        payload.shipping_address || '',
        payload.shipping_city || '',
        payload.shipping_postal_code || '',
        payload.shipping_method || '',
        payload.shipping_cost || 0,
        payload.tracking_number || null,
        payload.notes || null,
      ]
    );

    for (const item of payload.items) {
      await connection.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, size, color, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          orderId,
          item.product_id,
          item.quantity,
          item.size,
          item.color,
          item.price,
        ]
      );
    }

    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId]);
  });
  ok(res, { id: orderId });
});

router.put('/orders', requireAuth, requireAdmin, async (req, res) => {
  const { id, status, tracking_number } = req.body || {};
  if (!id) {
    fail(res, 400, 'Order id is required');
    return;
  }
  const updates = [];
  const values = [];
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (tracking_number !== undefined) {
    updates.push('tracking_number = ?');
    values.push(tracking_number);
  }
  if (updates.length === 0) {
    ok(res, true);
    return;
  }
  const [result] = await query(
    `UPDATE orders SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
    [...values, id]
  );
  if (result.affectedRows === 0) {
    fail(res, 404, 'Order not found');
    return;
  }
  ok(res, true);
});

router.get('/admin/brands', requireAuth, requireAdmin, async (_req, res) => {
  const [rows] = await query('SELECT id, name, description, logo_url, created_at FROM brands');
  ok(res, rows);
});

router.post('/admin/brands', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, logo_url } = req.body || {};
  if (!name) {
    fail(res, 400, 'Brand name is required');
    return;
  }
  const id = randomUUID();
  await query(
    'INSERT INTO brands (id, name, description, logo_url) VALUES (?, ?, ?, ?)',
    [id, name, description || null, logo_url || null]
  );
  ok(res, { id });
});

router.put('/admin/brands', requireAuth, requireAdmin, async (req, res) => {
  const { id, name, description, logo_url } = req.body || {};
  if (!id) {
    fail(res, 400, 'Brand id is required');
    return;
  }
  const updates = [];
  const values = [];
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (logo_url !== undefined) {
    updates.push('logo_url = ?');
    values.push(logo_url);
  }
  if (updates.length === 0) {
    ok(res, true);
    return;
  }
  const [result] = await query(
    `UPDATE brands SET ${updates.join(', ')} WHERE id = ?`,
    [...values, id]
  );
  if (result.affectedRows === 0) {
    fail(res, 404, 'Brand not found');
    return;
  }
  ok(res, true);
});

router.delete('/admin/brands', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    fail(res, 400, 'Brand id is required');
    return;
  }
  const [result] = await query('DELETE FROM brands WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'Brand not found');
    return;
  }
  ok(res, true);
});

router.get('/admin/categories', requireAuth, requireAdmin, async (_req, res) => {
  const [rows] = await query('SELECT id, name, description, created_at FROM categories');
  ok(res, rows);
});

router.post('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) {
    fail(res, 400, 'Category name is required');
    return;
  }
  const id = randomUUID();
  await query('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [
    id,
    name,
    description || null,
  ]);
  ok(res, { id });
});

router.put('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
  const { id, name, description } = req.body || {};
  if (!id) {
    fail(res, 400, 'Category id is required');
    return;
  }
  const updates = [];
  const values = [];
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (updates.length === 0) {
    ok(res, true);
    return;
  }
  const [result] = await query(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    [...values, id]
  );
  if (result.affectedRows === 0) {
    fail(res, 404, 'Category not found');
    return;
  }
  ok(res, true);
});

router.delete('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    fail(res, 400, 'Category id is required');
    return;
  }
  const [result] = await query('DELETE FROM categories WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'Category not found');
    return;
  }
  ok(res, true);
});

router.get('/admin/tags', requireAuth, requireAdmin, async (_req, res) => {
  const [rows] = await query('SELECT id, name, created_at FROM tags');
  ok(res, rows);
});

router.post('/admin/tags', requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    fail(res, 400, 'Tag name is required');
    return;
  }
  const id = randomUUID();
  await query('INSERT INTO tags (id, name) VALUES (?, ?)', [id, name]);
  ok(res, { id });
});

router.put('/admin/tags', requireAuth, requireAdmin, async (req, res) => {
  const { id, name } = req.body || {};
  if (!id) {
    fail(res, 400, 'Tag id is required');
    return;
  }
  if (name === undefined) {
    ok(res, true);
    return;
  }
  const [result] = await query('UPDATE tags SET name = ? WHERE id = ?', [name, id]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'Tag not found');
    return;
  }
  ok(res, true);
});

router.delete('/admin/tags', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    fail(res, 400, 'Tag id is required');
    return;
  }
  const [result] = await query('DELETE FROM tags WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'Tag not found');
    return;
  }
  ok(res, true);
});

router.get('/admin/summary', requireAuth, requireAdmin, async (_req, res) => {
  const [[totalProducts]] = await query('SELECT COUNT(*) AS totalProducts FROM products');
  const [[totalOrders]] = await query('SELECT COUNT(*) AS totalOrders FROM orders');
  const [[totalUsers]] = await query('SELECT COUNT(*) AS totalUsers FROM profiles');
  const [[totalRevenue]] = await query(
    'SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders'
  );
  ok(res, {
    totalProducts: totalProducts.totalProducts,
    totalOrders: totalOrders.totalOrders,
    totalUsers: totalUsers.totalUsers,
    totalRevenue: Number(totalRevenue.totalRevenue),
  });
});

router.get('/admin/users', requireAuth, requireAdmin, async (_req, res) => {
  const [rows] = await query(
    `SELECT p.id, u.username, p.full_name, p.phone, p.address, p.city, p.postal_code, p.role,
      p.created_at, p.updated_at
     FROM profiles p
     JOIN users u ON u.id = p.id`
  );
  ok(res, rows);
});

router.put('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const { id, role } = req.body || {};
  if (!id || !role) {
    fail(res, 400, 'User id and role are required');
    return;
  }
  const [result] = await query('UPDATE profiles SET role = ?, updated_at = NOW() WHERE id = ?', [
    role,
    id,
  ]);
  if (result.affectedRows === 0) {
    fail(res, 404, 'User not found');
    return;
  }
  ok(res, true);
});

router.get('/admin/reports', requireAuth, requireAdmin, async (_req, res) => {
  const [[totalRevenue]] = await query(
    'SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders'
  );
  const [[totalOrders]] = await query('SELECT COUNT(*) AS totalOrders FROM orders');
  const [[totalProducts]] = await query('SELECT COUNT(*) AS totalProducts FROM products');
  const [[totalUsers]] = await query('SELECT COUNT(*) AS totalUsers FROM profiles');

  const [revenueByMonth] = await query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
      COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders
     GROUP BY month
     ORDER BY month`
  );

  const [topProducts] = await query(
    `SELECT COALESCE(p.name, 'Unknown') AS name,
      SUM(oi.quantity) AS sales,
      SUM(oi.price * oi.quantity) AS revenue
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.product_id IS NOT NULL
     GROUP BY oi.product_id
     ORDER BY revenue DESC
     LIMIT 5`
  );

  const [recentOrders] = await query(
    `SELECT order_number, total_amount, created_at
     FROM orders
     ORDER BY created_at DESC
     LIMIT 5`
  );

  ok(res, {
    totalRevenue: Number(totalRevenue.totalRevenue),
    totalOrders: totalOrders.totalOrders,
    totalProducts: totalProducts.totalProducts,
    totalUsers: totalUsers.totalUsers,
    revenueByMonth: revenueByMonth.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue),
    })),
    topProducts: topProducts.map((row) => ({
      name: row.name,
      sales: Number(row.sales),
      revenue: Number(row.revenue),
    })),
    recentOrders: recentOrders.map((order) => ({
      order_number: order.order_number,
      total_amount: Number(order.total_amount),
      created_at: order.created_at,
    })),
  });
});

app.use('/api', router);

app.use((_req, res) => {
  fail(res, 404, 'Not found');
});

app.listen(port, () => {
  console.log(`Solemates API running on port ${port}`);
});
