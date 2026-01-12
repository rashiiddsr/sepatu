const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const now = () => new Date().toISOString();

const createSeedData = () => {
  const brandNikeId = randomUUID();
  const brandAdidasId = randomUUID();
  const categorySneakersId = randomUUID();
  const categoryRunningId = randomUUID();
  const superAdminProfileId = randomUUID();
  const adminProfileId = randomUUID();
  const customerProfileId = randomUUID();
  const superAdminUserId = randomUUID();
  const adminUserId = randomUUID();
  const customerUserId = randomUUID();

  return {
    users: [
      {
        id: superAdminUserId,
        email: 'superadmin@gmail.com',
        username: 'superadmin',
        password: 'superadmin',
        profile_id: superAdminProfileId,
      },
      {
        id: adminUserId,
        email: 'admin@solemates.local',
        username: 'adminsolemates',
        password: 'admin123',
        profile_id: adminProfileId,
      },
      {
        id: customerUserId,
        email: 'customer@solemates.local',
        username: 'customer',
        password: 'customer123',
        profile_id: customerProfileId,
      },
    ],
    profiles: [
      {
        id: superAdminProfileId,
        full_name: 'Superadmin',
        phone: null,
        address: null,
        city: null,
        postal_code: null,
        role: 'super_admin',
        created_at: now(),
        updated_at: now(),
      },
      {
        id: adminProfileId,
        full_name: 'Admin Solemates',
        phone: null,
        address: null,
        city: null,
        postal_code: null,
        role: 'admin',
        created_at: now(),
        updated_at: now(),
      },
      {
        id: customerProfileId,
        full_name: 'Customer Solemates',
        phone: null,
        address: null,
        city: null,
        postal_code: null,
        role: 'customer',
        created_at: now(),
        updated_at: now(),
      },
    ],
    brands: [
      {
        id: brandNikeId,
        name: 'Nike',
        description: 'Sportswear brand',
        logo_url: null,
        created_at: now(),
      },
      {
        id: brandAdidasId,
        name: 'Adidas',
        description: 'Performance footwear',
        logo_url: null,
        created_at: now(),
      },
    ],
    categories: [
      {
        id: categorySneakersId,
        name: 'Sneakers',
        description: 'Lifestyle sneakers',
        created_at: now(),
      },
      {
        id: categoryRunningId,
        name: 'Running',
        description: 'Running shoes',
        created_at: now(),
      },
    ],
    products: [
      {
        id: randomUUID(),
        name: 'Air Max Pulse',
        description: 'Comfortable sneaker for everyday wear.',
        brand_id: brandNikeId,
        category_id: categorySneakersId,
        price: 1450000,
        stock: 20,
        sizes: ['39', '40', '41', '42', '43'],
        colors: ['Black', 'White'],
        image_url:
          'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: [],
        is_featured: true,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: randomUUID(),
        name: 'Ultraboost Light',
        description: 'Responsive running shoe with lightweight cushioning.',
        brand_id: brandAdidasId,
        category_id: categoryRunningId,
        price: 1650000,
        stock: 14,
        sizes: ['38', '39', '40', '41', '42'],
        colors: ['Grey', 'Blue'],
        image_url:
          'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: [],
        is_featured: false,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: randomUUID(),
        name: 'Street Classic',
        description: 'Timeless sneaker style with durable build.',
        brand_id: brandAdidasId,
        category_id: categorySneakersId,
        price: 950000,
        stock: 25,
        sizes: ['40', '41', '42', '43', '44'],
        colors: ['White', 'Green'],
        image_url:
          'https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: [],
        is_featured: true,
        created_at: now(),
        updated_at: now(),
      },
    ],
    cart_items: [],
    wishlist_items: [],
    orders: [],
    order_items: [],
  };
};

const resolveDataFile = () => {
  const configured = process.env.DATA_FILE || './data/store.json';
  return path.resolve(__dirname, '..', configured);
};

let storeCache = null;

const loadStore = async () => {
  if (storeCache) {
    return storeCache;
  }
  const filePath = resolveDataFile();
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    storeCache = JSON.parse(raw);
  } catch (error) {
    storeCache = createSeedData();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(storeCache, null, 2));
  }
  return storeCache;
};

const saveStore = async (nextStore) => {
  const filePath = resolveDataFile();
  storeCache = nextStore;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(storeCache, null, 2));
};

const updateStore = async (mutator) => {
  const store = await loadStore();
  const result = await mutator(store);
  await saveStore(store);
  return result;
};

module.exports = {
  loadStore,
  saveStore,
  updateStore,
  now,
  createId: () => randomUUID(),
};
