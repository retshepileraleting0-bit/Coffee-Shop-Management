/**
 * ============================================================================
 * ORDERS REST API ROUTES
 * ============================================================================
 * Handles customer order placement, order lookup, status lifecycle updates,
 * and daily sales summaries.
 *
 * Endpoints:
 *   GET    /api/orders             - Retrieve all orders (staff only)
 *   GET    /api/orders/summary     - Basic daily summary and totals (staff only)
 *   GET    /api/orders/:id         - Retrieve a specific order by ID (customer & staff)
 *   POST   /api/orders             - Place a new order (customer)
 *   PATCH  /api/orders/:id/status  - Update order status (staff only)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { requireStaffAuth } = require('../middleware/auth');

// Valid status lifecycle values as specified in project requirements
const VALID_STATUSES = ['Pending', 'Preparing', 'Ready', 'Collected'];

/**
 * Helper to generate a clean, human-readable unique order number
 * Example: ORD-8419
 */
function generateOrderNumber() {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${randomDigits}`;
}

/**
 * GET /api/orders/summary
 * Purpose: View order totals and basic daily order summaries
 * Protected: Staff only
 * Note: Placed BEFORE /:id so Express does not treat 'summary' as an :id parameter.
 */
router.get('/summary', requireStaffAuth, async (req, res, next) => {
  try {
    const orders = await db.getAllByPrefix('order:');

    // Total orders count
    const totalOrders = orders.length;

    // Status counts
    const statusCounts = {
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Collected: 0
    };

    let totalRevenue = 0;
    const popularItemsCount = {};

    orders.forEach((order) => {
      // Tally statuses
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }

      // Add to revenue (all non-cancelled orders)
      totalRevenue += Number(order.totalAmount || 0);

      // Tally items
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          popularItemsCount[item.name] = (popularItemsCount[item.name] || 0) + (item.quantity || 1);
        });
      }
    });

    // Format top 5 popular items
    const popularItems = Object.entries(popularItemsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        statusCounts,
        popularItems,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders
 * Purpose: Retrieve customer orders.
 * Protected: Staff only.
 * Supports optional ?status=Pending query filter.
 */
router.get('/', requireStaffAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    let orders = await db.getAllByPrefix('order:');

    // Optional status filter
    if (status && status !== 'All') {
      orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }

    // Sort newest orders first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Purpose: Retrieve a specific order by ID (used for order confirmation and customer tracking)
 * Public: Customers can check their own order status using their unique order ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Normalise to uppercase for convenience
    const lookupId = id.trim().toUpperCase();

    // Look up by direct key 'order:ORD-XXXX' or raw id
    let order = await db.get(`order:${lookupId}`);

    if (!order) {
      // Also check if they supplied the id without prefix or with lowercase
      order = await db.get(`order:${id.trim()}`);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order '${id}' was not found. Please verify your order number.`
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders
 * Purpose: Place a new customer order.
 * Public.
 */
router.post('/', async (req, res, next) => {
  try {
    const { customerName, orderType, tableNumber, notes, items } = req.body;

    // Validate customer name
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required to place an order.'
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.'
      });
    }

    // Validate and recalculate item prices to prevent client-side price tampering
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.id || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item data or quantity provided.'
        });
      }

      // Fetch official menu item from Key-Value store
      const menuItem = await db.get(`menu:${item.id}`);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Item '${item.name || item.id}' is no longer available on the menu.`
        });
      }

      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `Sorry, '${menuItem.name}' is currently sold out.`
        });
      }

      const qty = parseInt(item.quantity, 10);
      const itemPrice = Number(menuItem.price);
      const lineTotal = parseFloat((itemPrice * qty).toFixed(2));

      subtotal += lineTotal;
      validatedItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: itemPrice,
        quantity: qty,
        lineTotal: lineTotal
      });
    }

    // Calculate tax (5%) and final total
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const totalAmount = parseFloat((subtotal + tax).toFixed(2));

    // Generate unique order ID
    let orderId = generateOrderNumber();
    // Ensure collision avoidance
    let exists = await db.get(`order:${orderId}`);
    while (exists) {
      orderId = generateOrderNumber();
      exists = await db.get(`order:${orderId}`);
    }

    const newOrder = {
      id: orderId,
      customerName: customerName.trim(),
      orderType: orderType === 'Dine-in' ? 'Dine-in' : 'Takeaway',
      tableNumber: tableNumber ? String(tableNumber).trim() : null,
      notes: notes ? notes.trim() : '',
      items: validatedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: tax,
      totalAmount: totalAmount,
      status: 'Pending', // Initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in Key-Value NoSQL database: key = "order:<id>"
    await db.set(`order:${orderId}`, newOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: newOrder
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/orders/:id/status
 * Purpose: Update order status (Pending -> Preparing -> Ready -> Collected).
 * Protected: Staff only.
 */
router.patch('/:id/status', requireStaffAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const lookupId = id.trim().toUpperCase();
    let order = await db.get(`order:${lookupId}`);

    if (!order) {
      order = await db.get(`order:${id.trim()}`);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order '${id}' was not found.`
      });
    }

    // Update status
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // Persist updated order back to Key-Value store
    await db.set(`order:${order.id}`, order);

    res.json({
      success: true,
      message: `Order ${order.id} status updated to '${status}'.`,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

