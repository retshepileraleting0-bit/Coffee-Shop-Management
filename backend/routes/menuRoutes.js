/**
 * ============================================================================
 * MENU REST API ROUTES
 * ============================================================================
 * Implements CRUD operations for coffee shop menu items backed by the
 * Key-Value NoSQL database.
 *
 * Endpoints:
 *   GET    /api/menu       - Retrieve all menu items (public)
 *   GET    /api/menu/:id   - Retrieve one menu item (public)
 *   POST   /api/menu       - Add a new menu item (staff only)
 *   PUT    /api/menu/:id   - Update an existing menu item (staff only)
 *   DELETE /api/menu/:id   - Delete a menu item (staff only)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { requireStaffAuth } = require('../middleware/auth');

/**
 * GET /api/menu
 * Purpose: Retrieve all menu items.
 * Optional query: ?category=Hot+Coffee or ?available=true
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, available } = req.query;
    let items = await db.getAllByPrefix('menu:');

    // Filter by category if requested
    if (category && category !== 'All') {
      items = items.filter((item) => item.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by availability if requested
    if (available !== undefined) {
      const isAvailable = available === 'true';
      items = items.filter((item) => item.available === isAvailable);
    }

    // Sort items by name alphabetically for consistent display
    items.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/menu/:id
 * Purpose: Retrieve one specific menu item.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await db.get(`menu:${id}`);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Menu item with ID '${id}' was not found.`
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/menu
 * Purpose: Add a new menu item.
 * Protected: Staff only.
 */
router.post('/', requireStaffAuth, async (req, res, next) => {
  try {
    const { name, category, price, description, available, imageUrl } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Item name is required.' });
    }
    if (price === undefined || price === null || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Item price must be a positive number.' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, message: 'Item category is required.' });
    }

    // Generate unique ID
    const uniqueId = `item-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

    const newItem = {
      id: uniqueId,
      name: name.trim(),
      category: category.trim(),
      price: parseFloat(Number(price).toFixed(2)),
      description: description ? description.trim() : 'Freshly prepared coffee shop item.',
      available: available !== undefined ? Boolean(available) : true,
      imageUrl: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    // Store in Key-Value NoSQL database: key = "menu:<id>"
    await db.set(`menu:${uniqueId}`, newItem);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      data: newItem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/menu/:id
 * Purpose: Update an existing menu item.
 * Protected: Staff only.
 */
router.put('/:id', requireStaffAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.get(`menu:${id}`);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Cannot update: Menu item with ID '${id}' does not exist.`
      });
    }

    const { name, category, price, description, available, imageUrl } = req.body;

    // Validate if fields are provided
    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Item name cannot be empty.' });
    }
    if (price !== undefined && (isNaN(price) || Number(price) <= 0)) {
      return res.status(400).json({ success: false, message: 'Item price must be a positive number.' });
    }

    // Merge updates
    const updatedItem = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      category: category !== undefined ? category.trim() : existing.category,
      price: price !== undefined ? parseFloat(Number(price).toFixed(2)) : existing.price,
      description: description !== undefined ? description.trim() : existing.description,
      available: available !== undefined ? Boolean(available) : existing.available,
      imageUrl: imageUrl !== undefined && imageUrl.trim() !== '' ? imageUrl.trim() : existing.imageUrl,
      updatedAt: new Date().toISOString()
    };

    // Save updated record
    await db.set(`menu:${id}`, updatedItem);

    res.json({
      success: true,
      message: 'Menu item updated successfully.',
      data: updatedItem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/menu/:id
 * Purpose: Delete a menu item.
 * Protected: Staff only.
 */
router.delete('/:id', requireStaffAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.get(`menu:${id}`);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Cannot delete: Menu item with ID '${id}' was not found.`
      });
    }

    await db.del(`menu:${id}`);

    res.json({
      success: true,
      message: `Menu item '${existing.name}' was deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
