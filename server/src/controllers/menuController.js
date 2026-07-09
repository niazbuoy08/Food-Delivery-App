import MenuItem from '../models/MenuItem.js';
import { ALLERGENS, CATEGORIES } from '../constants.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

// GET /api/menu?category=&search=  (public)
// Customers only ever see available items.
export const getMenu = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = { isAvailable: true };

  if (category && category !== 'All') filter.category = category;
  if (search?.trim()) {
    // Escape regex metacharacters — a search for "20% off" shouldn't be a pattern.
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
    ];
  }

  const items = await MenuItem.find(filter).sort({ isPopular: -1, name: 1 });
  res.json({ success: true, count: items.length, categories: CATEGORIES, items });
});

// GET /api/menu/:id  (public)
export const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item || !item.isAvailable) throw new ApiError(404, 'That dish is not on the menu.');
  res.json({ success: true, item });
});

// --- Admin ---

// GET /api/admin/menu — includes unavailable items so they can be toggled back on.
export const adminListMenu = asyncHandler(async (_req, res) => {
  const items = await MenuItem.find().sort({ category: 1, name: 1 });
  res.json({ success: true, count: items.length, categories: CATEGORIES, allergens: ALLERGENS, items });
});

// POST /api/admin/menu
export const createMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(pickMenuFields(req.body));
  res.status(201).json({ success: true, item });
});

// PATCH /api/admin/menu/:id
export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, pickMenuFields(req.body), {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, 'Menu item not found.');
  res.json({ success: true, item });
});

// DELETE /api/admin/menu/:id
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found.');
  res.json({ success: true, message: `"${item.name}" was removed from the menu.` });
});

// Whitelist the fields a request may set, so a stray `_id` or `createdAt` in the
// body can't overwrite anything.
function pickMenuFields(body) {
  const allowed = [
    'name',
    'description',
    'price',
    'category',
    'image',
    'isVeg',
    'isAvailable',
    'isPopular',
    'prepTimeMins',
    'allergens',
  ];
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );
}
