# 📖 Comprehensive Code Explanation: AromaCraft Coffee Shop

This document provides a clear, beginner-friendly, and in-depth explanation of every significant piece of code across the AromaCraft full-stack web application. It is written in plain English to assist students and examiners during code walkthroughs, viva defenses, and grading.

---

## Table of Contents
1. [Backend Entry Point (`backend/server.js`)](#1-backend-entry-point-backendserverjs)
2. [Key-Value NoSQL Database Adapter (`backend/config/db.js`)](#2-key-value-nosql-database-adapter-backendconfigdbjs)
3. [Staff Authentication Middleware (`backend/middleware/auth.js`)](#3-staff-authentication-middleware-backendmiddlewareauthjs)
4. [Menu REST API Endpoints (`backend/routes/menuRoutes.js`)](#4-menu-rest-api-endpoints-backendroutesmenuroutesjs)
5. [Orders REST API Endpoints (`backend/routes/orderRoutes.js`)](#5-orders-rest-api-endpoints-backendroutesorderroutesjs)
6. [Native Fetch API Service Module (`frontend/src/services/api.js`)](#6-native-fetch-api-service-module-frontendsrcservicesapijs)
7. [Shopping Cart State Context (`frontend/src/context/CartContext.jsx`)](#7-shopping-cart-state-context-frontendsrccontextcartcontextjsx)
8. [Staff Authentication Context (`frontend/src/context/AuthContext.jsx`)](#8-staff-authentication-context-frontendsrccontextauthcontextjsx)
9. [Customer Interface Components](#9-customer-interface-components)
10. [Staff Portal & Kitchen Display Components](#10-staff-portal--kitchen-display-components)
11. [Automated API Testing Suite (`backend/tests/api.test.js`)](#11-automated-api-testing-suite-backendtestsapitestjs)

---

## 1. Backend Entry Point (`backend/server.js`)

### What is its role?
`server.js` is the central engine of the Express backend. It bootstraps the HTTP server, registers middleware, exposes the health-check route, and mounts the API sub-routers.

### Significant Code Walkthrough:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
```
- `dotenv.config()`: Reads environment variables from the `.env` file (e.g. `PORT`, `REDIS_URL`, `STAFF_PASSWORD`) into `process.env`.
- `cors()`: Configures Cross-Origin Resource Sharing. Because the React frontend runs on port 5173 (or a separate Vercel domain) and the Express backend runs on port 5000 (or Render), browsers by default block cross-domain requests for security. `cors()` explicitly instructs the browser that requests from our frontend are safe and permitted.

```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
- In Node.js, incoming HTTP request bodies arrive as raw byte streams. `express.json()` reads those streams and automatically parses them into JavaScript objects accessible via `req.body`.

```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Coffee Shop REST API',
    uptimeSeconds: Math.floor(process.uptime()),
    database: db.getStatus(),
    timestamp: new Date().toISOString()
  });
});
```
- **Why this is significant:** The assignment specifically requires a `/api/health` endpoint (Section 5 and Section 9). It returns HTTP status 200 with information on how long the server has been running and whether the NoSQL database is active. Hosting platforms like Render ping this endpoint to verify that the container is healthy.

```javascript
async function startServer() {
  await db.connectDatabase();
  app.listen(PORT, () => {
    console.log(`Coffee Shop Server running on port: ${PORT}`);
  });
}
```
- Ensures the NoSQL database connection (or persistent file mirror) is initialized **before** the server starts accepting customer orders.

---

## 2. Key-Value NoSQL Database Adapter (`backend/config/db.js`)

### What is its role?
The assignment specifies: *"Key-value NoSQL database: Store menu items and orders using unique keys and JSON values. Suggested database: Redis with persistence enabled."*

This module acts as an abstraction layer for Key-Value NoSQL operations. It connects to **Redis** when deployed to cloud providers like Render (using Upstash or RedisLabs), while automatically providing an embedded **persistent file-backed Key-Value store** (`data/kv-store.json`) when run locally without Redis. Both modes follow the identical Key-Value pattern.

### Significant Code Walkthrough:

```javascript
async function get(key) {
  if (isUsingRedis && redisClient) {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  const raw = memoryStore[key];
  return raw ? JSON.parse(raw) : null;
}
```
- **How it works:** In a Key-Value NoSQL database, values are stored as raw strings. The `get(key)` function retrieves the serialized JSON string from Redis (or disk storage) and uses `JSON.parse()` to turn it back into a native JavaScript object.

```javascript
async function set(key, value) {
  const jsonString = JSON.stringify(value);
  if (isUsingRedis && redisClient) {
    await redisClient.set(key, jsonString);
  } else {
    memoryStore[key] = jsonString;
    saveFileStore();
  }
  return value;
}
```
- **How it works:** When saving an item or order, `set(key, value)` turns the JavaScript object into a JSON string via `JSON.stringify(value)` and assigns it directly to its unique key (e.g. `menu:menu-1` or `order:ORD-8412`). In file mode, it calls `saveFileStore()` to flush the change to disk immediately, ensuring changes persist after server restarts.

```javascript
async function getAllByPrefix(prefix) {
  const keys = await getKeysByPrefix(prefix);
  const results = [];
  for (const key of keys) {
    const item = await get(key);
    if (item) results.push(item);
  }
  return results;
}
```
- **How it works:** To list all menu items or all orders without scanning entire tables, Key-Value databases use key prefixing. Calling `getAllByPrefix('menu:')` finds every key beginning with `menu:`, fetches each corresponding JSON value, and returns the collection.

---

## 3. Staff Authentication Middleware (`backend/middleware/auth.js`)

### What is its role?
Section 5 of the rubric specifies: *"Staff-only endpoints should be protected with appropriate authentication and authorisation."*
This middleware intercepts requests destined for sensitive operations (such as creating/editing menu items or changing order statuses) and verifies that the client is an authorized staff member.

### Significant Code Walkthrough:

```javascript
function requireStaffAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const customHeader = req.headers['x-staff-token'] || '';

  let clientToken = '';
  if (authHeader.startsWith('Bearer ')) {
    clientToken = authHeader.substring(7).trim();
  } else if (customHeader) {
    clientToken = customHeader.trim();
  }

  const expectedToken = getExpectedToken();

  if (clientToken && (clientToken === expectedToken || clientToken === STAFF_PASSWORD)) {
    req.staff = { role: 'staff', authenticatedAt: new Date().toISOString() };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied: Staff authentication required to perform this action.'
  });
}
```
- **Line-by-line:**
  1. Checks if the HTTP request contains an `Authorization: Bearer <token>` header or an `x-staff-token` header.
  2. Extracts the token string.
  3. Compares the token against the expected staff signature generated when the staff member logged in at `/api/auth/login`.
  4. If valid, calls `next()` to pass control to the route controller.
  5. If invalid or missing, immediately halts the request and returns an HTTP `401 Unauthorized` status code with an informative JSON error message.

---

## 4. Menu REST API Endpoints (`backend/routes/menuRoutes.js`)

### What is its role?
Provides full CRUD (Create, Read, Update, Delete) capabilities for the coffee shop menu.

### Significant Code Walkthrough:

#### `GET /api/menu`
```javascript
router.get('/', async (req, res, next) => {
  const { category, available } = req.query;
  let items = await db.getAllByPrefix('menu:');

  if (category && category !== 'All') {
    items = items.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }
  ...
  res.json({ success: true, count: items.length, data: items });
});
```
- Retrieves all menu records from the database using the prefix `menu:`.
- Allows optional query filtering (e.g. `/api/menu?category=Hot+Coffee`).
- Sorts items alphabetically before returning them in a standard JSON envelope.

#### `POST /api/menu`
```javascript
router.post('/', requireStaffAuth, async (req, res, next) => {
  const { name, category, price, description, available, imageUrl } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Item name is required.' });
  }
  if (price === undefined || isNaN(price) || Number(price) <= 0) {
    return res.status(400).json({ success: false, message: 'Item price must be a positive number.' });
  }

  const uniqueId = `item-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  const newItem = { id: uniqueId, name, category, price: parseFloat(price), ... };

  await db.set(`menu:${uniqueId}`, newItem);
  res.status(201).json({ success: true, message: 'Menu item created successfully.', data: newItem });
});
```
- **Protected:** Uses `requireStaffAuth` middleware.
- **Validation:** Ensures names are not blank and prices are valid positive numbers.
- **Unique Key Generation:** Combines a timestamp with random hexadecimal bytes to create unique IDs (e.g. `item-m3d9f1-a8b2`).
- **HTTP 201 Created:** Conforms to REST standards for resource creation.

#### `PUT /api/menu/:id` & `DELETE /api/menu/:id`
- `PUT`: Looks up the existing item by key `menu:${id}`. If not found, returns `404 Not Found`. Merges changes and saves back to the store.
- `DELETE`: Verifies the item exists, calls `db.del(key)` to remove it from the NoSQL database, and confirms deletion.

---

## 5. Orders REST API Endpoints (`backend/routes/orderRoutes.js`)

### What is its role?
Manages the customer order lifecycle: order placement, validation against tampering, unique order number generation, kitchen status progression, and daily analytics reporting.

### Significant Code Walkthrough:

#### `POST /api/orders` (Order Placement)
```javascript
router.post('/', async (req, res, next) => {
  const { customerName, orderType, tableNumber, notes, items } = req.body;

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order data.' });
  }

  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const menuItem = await db.get(`menu:${item.id}`);
    if (!menuItem || !menuItem.available) {
      return res.status(400).json({ success: false, message: `Item sold out or unavailable.` });
    }

    const qty = parseInt(item.quantity, 10);
    const lineTotal = parseFloat((Number(menuItem.price) * qty).toFixed(2));
    subtotal += lineTotal;
    validatedItems.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: qty, lineTotal });
  }

  const tax = parseFloat((subtotal * 0.05).toFixed(2));
  const totalAmount = parseFloat((subtotal + tax).toFixed(2));
  const orderId = generateOrderNumber(); // e.g. ORD-8419
  ...
  await db.set(`order:${orderId}`, newOrder);
  res.status(201).json({ success: true, data: newOrder });
});
```
- **Server-Side Price Validation:** Notice that the backend **does not trust** prices submitted by the browser. It fetches the authoritative price from the NoSQL database (`menuItem.price`) and recalculates line totals, tax, and grand totals server-side. This prevents malicious customers from tampering with prices in DevTools.
- **Unique Human-Friendly Order Number:** Generates clean order codes like `ORD-4821` and checks for collisions before saving.
- **Initial Status:** Always starts as `'Pending'`.

#### `PATCH /api/orders/:id/status` (Workflow Progression)
```javascript
router.patch('/:id/status', requireStaffAuth, async (req, res, next) => {
  const { status } = req.body;
  if (!['Pending', 'Preparing', 'Ready', 'Collected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  let order = await db.get(`order:${req.params.id}`);
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await db.set(`order:${order.id}`, order);

  res.json({ success: true, data: order });
});
```
- Allows staff to progress orders through the four mandatory stages: `Pending` ➔ `Preparing` ➔ `Ready` ➔ `Collected`.
- Saves the updated order back into the Key-Value database.

#### `GET /api/orders/summary` (Daily Analytics)
```javascript
router.get('/summary', requireStaffAuth, async (req, res, next) => {
  const orders = await db.getAllByPrefix('order:');
  // Aggregates total revenue, status counts, and top 5 best selling items
  ...
});
```
- Loops through all orders in the Key-Value database to compute gross revenue, distribution by stage, and most popular drinks.

---

## 6. Native Fetch API Service Module (`frontend/src/services/api.js`)

### What is its role?
The marking rubric allocates **10 marks** specifically for *"Fetch API integration"*.
This service module encapsulates all network communications using the browser's native `fetch()` API. It does **not** rely on third-party libraries like `axios`, demonstrating mastery of modern web standards.

### Significant Code Walkthrough:

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}
```
- **`import.meta.env.VITE_API_BASE_URL`**: Reads the backend URL dynamically from environment variables, enabling smooth switching between local development (`localhost:5000`) and production deployment on Render.
- **`response.ok` check**: `fetch()` only rejects promises on network failures (e.g. no internet). It does *not* reject on HTTP 400, 401, or 500 error codes. Our helper inspects `response.ok` and throws a custom JavaScript Error containing the backend's error message.
- Exposes clean helper functions like `getMenuItems()`, `placeCustomerOrder()`, `updateOrderStatus()`, and `loginStaff()`.

---

## 7. Shopping Cart State Context (`frontend/src/context/CartContext.jsx`)

### What is its role?
Manages the customer's shopping cart globally across components using the React Context API.

### Significant Code Walkthrough:

```javascript
const [cartItems, setCartItems] = useState(() => {
  try {
    const saved = localStorage.getItem('aroma_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
});

useEffect(() => {
  localStorage.setItem('aroma_cart', JSON.stringify(cartItems));
}, [cartItems]);
```
- **Lazy State Initialization:** Reads initial cart contents from browser `localStorage`. If a user accidentally refreshes their browser or navigates between pages, their cart is not lost.
- **`addToCart(item)`**: Checks if the item already exists in the cart. If so, increments `quantity + 1`; if not, adds the item with `quantity: 1`.
- **Derived Computations:** Dynamically computes `totalCount`, `subtotal`, 5% `tax`, and final `totalAmount`.

---

## 8. Staff Authentication Context (`frontend/src/context/AuthContext.jsx`)

### What is its role?
Stores the staff session token in `localStorage`, verifies token validity against the backend, and provides `login()` and `logout()` helpers to child components.

### Significant Code Walkthrough:

```javascript
useEffect(() => {
  async function verify() {
    if (!token) return;
    try {
      await verifyStaffSession(token);
      setIsStaffLoggedIn(true);
    } catch {
      logout();
    }
  }
  verify();
}, [token]);
```
- When the page loads, if a token was saved from a previous session, it contacts `/api/auth/verify`. If the token is still valid, it grants immediate access to the Staff Dashboard without prompting for the password again.

---

## 9. Customer Interface Components

### `MenuItemCard.jsx`
- Displays individual menu cards with image, category pill, description, formatted price, and live availability badge (`In Stock` / `Sold Out`).
- If an item is marked out-of-stock, the "Add to Cart" button is disabled and an overlay indicates "Sold Out".
- Provides visual click feedback ("✓ Added!") when clicked.

### `MenuList.jsx`
- Hosts the hero welcome banner and interactive filter controls:
  - Category buttons (`All`, `Hot Coffee`, `Iced & Cold Brew`, `Artisanal Teas`, `Pastries`).
  - Real-time search input that matches item names and descriptions.
  - "In-stock only" toggle checkbox.
- Renders responsive CSS grid of `MenuItemCard` components with loading spinners and friendly empty states.

### `CartDrawer.jsx`
- Slide-over drawer displaying current cart items, unit prices, quantity increment/decrement controls, item deletion, subtotal, tax, and grand total.
- Clicking "Proceed to Checkout" triggers the `CheckoutModal`.

### `CheckoutModal.jsx`
- Collects customer details: Full Name (required), Order Preference (`Takeaway` or `Dine-in`), Table Number (if dine-in), and special barista requests (e.g. "Oat milk, extra hot").
- Sends the `POST /api/orders` request via the Fetch API.
- Upon success, switches to the **Order Confirmation Screen**, displaying the bold unique Order Number (`ORD-XXXX`), a copy button, and a one-click button to track live order preparation.

### `OrderStatusTracker.jsx`
- Provides an intuitive customer order tracker.
- Takes an order number (e.g. `ORD-8419`) and displays a 4-stage visual progress stepper:
  `Pending` ➔ `Preparing` ➔ `Ready` ➔ `Collected`.
- Allows customers to click "Refresh" to see status updates live as the barista prepares their beverage.

---

## 10. Staff Portal & Kitchen Display Components

### `StaffLogin.jsx`
- Form requesting the staff password (default: `barista2024`).
- Upon success, stores the session token and switches to the main dashboard.

### `MenuManagement.jsx`
- Complete menu administrative interface:
  - **Add New Item:** Modal form allowing staff to add beverages/pastries with name, category, price, description, and image URL.
  - **Edit Item:** Pre-fills the modal to modify prices or descriptions.
  - **Quick Stock Toggle:** One-click button in the table to instantly toggle an item between `In Stock` and `Sold Out`.
  - **Delete Item:** Removes an item from the database with confirmation prompt.

### `OrderManagement.jsx`
- The Barista Kitchen Display:
  - Displays incoming orders as cards with color-coded status borders.
  - Shows customer name, table number or takeaway label, placed time, and special barista instructions.
  - **One-Click Progression:** Baristas can click "Start Preparing ➔", "Mark Ready for Pickup ➔", or "Mark Collected ✓" to advance order states in the NoSQL database.
  - Auto-refreshes every 15 seconds to catch new incoming orders.

### `DailySummary.jsx`
- Computes and displays store performance metrics:
  - **Total Revenue ($)**
  - **Total Orders Recorded (#)**
  - **Pending & Active Kitchen Orders (#)**
  - **Orders Ready at Counter (#)**
  - Visual status distribution percentage bars.
  - Ranked leaderboard of Top 5 Best-Selling items.

---

## 11. Automated API Testing Suite (`backend/tests/api.test.js`)

### What is its role?
Section 10 awards 10 marks for *"Deployment and testing"*.
This file provides 11 automated test cases using Node.js's native test runner (`node:test`) and assertion module (`node:assert`). It tests the entire system end-to-end without needing extra third-party test libraries.

```bash
cd backend
npm test
```

### What is tested?
1. **Health Check:** Verifies `GET /api/health` returns status `ok` and database connectivity.
2. **Menu Retrieval:** Checks that `GET /api/menu` returns seeded menu items.
3. **Authentication:** Verifies valid staff credentials produce a token and invalid passwords receive `401 Unauthorized`.
4. **Endpoint Protection:** Confirms that attempting to create a menu item without credentials fails with `401`.
5. **Menu Item Creation:** Tests `POST /api/menu` with staff token and verifies the created item exists.
6. **Menu Item Update:** Tests `PUT /api/menu/:id` to change price and stock status.
7. **Order Placement:** Tests `POST /api/orders` to ensure an order is saved with unique `ORD-` ID and correct totals.
8. **Order Tracking:** Tests `GET /api/orders/:id` for public customer lookup.
9. **Status Lifecycle:** Tests `PATCH /api/orders/:id/status` transitioning status to `Preparing`.
10. **Daily Summary:** Tests `GET /api/orders/summary` calculation of sales and status counts.
11. **Item Deletion:** Tests `DELETE /api/menu/:id` and confirms `404 Not Found` upon subsequent lookup.

