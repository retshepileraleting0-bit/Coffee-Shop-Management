/**
 * ============================================================================
 * BACKEND API AUTOMATED TESTS
 * ============================================================================
 * Uses Node.js built-in test runner ('node:test') and assertion library ('node:assert').
 * Runs with: npm test (or node --test tests/api.test.js)
 *
 * Tests all core requirements:
 *   1. Health check (/api/health)
 *   2. Menu retrieval (/api/menu)
 *   3. Staff authentication protection (/api/auth/login)
 *   4. Menu item creation and deletion (/api/menu)
 *   5. Order placement, lookup, and status lifecycle (/api/orders)
 *   6. Daily summary reporting (/api/orders/summary)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');
const db = require('../config/db');

let server;
let baseUrl;
let staffToken;
let testItemId;
let testOrderId;

// Start server on a dynamic port before running tests
test.before(async () => {
  await db.connectDatabase();
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

// Close server after tests
test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// Helper for making HTTP requests in tests using native fetch
async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const { headers, ...restOptions } = options;
  const response = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    }
  });
  const data = await response.json();
  return { status: response.status, data };
}

// ============================================================================
// TEST SUITE
// ============================================================================

test('1. GET /api/health should return status: ok and database info', async () => {
  const res = await apiRequest('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
  assert.ok(res.data.database);
  assert.equal(res.data.database.status, 'connected');
});

test('2. GET /api/menu should return existing menu items array', async () => {
  const res = await apiRequest('/api/menu');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.data));
  assert.ok(res.data.data.length > 0, 'Menu should have seeded items');
});

test('3. Staff Authentication should succeed with valid password and reject invalid', async () => {
  // Invalid password attempt
  const badLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'wrongpassword' })
  });
  assert.equal(badLogin.status, 401);
  assert.equal(badLogin.data.success, false);

  // Valid password attempt
  const goodLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'barista2024' })
  });
  assert.equal(goodLogin.status, 200);
  assert.equal(goodLogin.data.success, true);
  assert.ok(goodLogin.data.token, 'Should return staff session token');
  staffToken = goodLogin.data.token;
});

test('4. POST /api/menu without auth should be rejected with 401', async () => {
  const res = await apiRequest('/api/menu', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Unauthorized Coffee',
      category: 'Hot Coffee',
      price: 3.50
    })
  });
  assert.equal(res.status, 401);
  assert.equal(res.data.success, false);
});

test('5. POST /api/menu with staff token should successfully add a new item', async () => {
  const res = await apiRequest('/api/menu', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      name: 'Hazelnut Cortado',
      category: 'Hot Coffee',
      price: 42.00,
      description: 'Equal parts espresso and hazelnut warm milk',
      available: true
    })
  });

  assert.equal(res.status, 201);
  assert.equal(res.data.success, true);
  assert.equal(res.data.data.name, 'Hazelnut Cortado');
  assert.ok(res.data.data.id);
  testItemId = res.data.data.id;
});

test('6. PUT /api/menu/:id should update menu item details', async () => {
  const res = await apiRequest(`/api/menu/${testItemId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      price: 48.00,
      available: false
    })
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.data.price, 48.00);
  assert.equal(res.data.data.available, false);
});

test('7. POST /api/orders should allow customer to place an order', async () => {
  // Use seeded item 'menu-1'
  const res = await apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'Alice Cooper',
      orderType: 'Takeaway',
      notes: 'Extra napkin please',
      items: [
        { id: 'menu-1', quantity: 2 }
      ]
    })
  });

  assert.equal(res.status, 201);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.id.startsWith('ORD-'));
  assert.equal(res.data.data.customerName, 'Alice Cooper');
  assert.equal(res.data.data.status, 'Pending');
  assert.ok(res.data.data.totalAmount > 0);
  testOrderId = res.data.data.id;
});

test('8. GET /api/orders/:id should allow tracking an order by ID', async () => {
  const res = await apiRequest(`/api/orders/${testOrderId}`);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.data.id, testOrderId);
  assert.equal(res.data.data.customerName, 'Alice Cooper');
});

test('9. PATCH /api/orders/:id/status should update order status', async () => {
  const res = await apiRequest(`/api/orders/${testOrderId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ status: 'Preparing' })
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.data.status, 'Preparing');
});

test('10. GET /api/orders/summary should return daily analytics', async () => {
  const res = await apiRequest('/api/orders/summary', {
    headers: { Authorization: `Bearer ${staffToken}` }
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.totalOrders >= 1);
  assert.ok(res.data.data.statusCounts);
  assert.ok(res.data.data.totalRevenue > 0);
});

test('11. DELETE /api/menu/:id should delete the test menu item', async () => {
  const res = await apiRequest(`/api/menu/${testItemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${staffToken}` }
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);

  // Confirm item is gone
  const check = await apiRequest(`/api/menu/${testItemId}`);
  assert.equal(check.status, 404);
});
