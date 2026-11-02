# 📑 BIWA2110 Final Project Report: Coffee Shop Management System

**Course:** BIWA2110 — Web Application Development  
**Department:** Faculty of Information & Communication Technology  
**Degrees:** BSc. in Information Technology & BSc. in Software Engineering and Multimedia  
**Assignment:** Group Assignment (40%)  
**Lecturers:** Mr. Mofolo / Mr. Takalimane  
**System Name:** AromaCraft Coffee Shop Management Web Application  
**Date:** November 2026  

---

## 1. Executive Summary
The **AromaCraft Coffee Shop Management System** is a full-stack, decoupled web application engineered to replace manual, paper-based order management with a centralized digital system. The solution empowers customers to browse products, customize orders, and track order fulfillment in real-time, while giving coffee shop staff administrative tools to update menus, manage kitchen workflows, and review sales performance.

The project demonstrates full-stack architecture adhering to the BIWA2110 curriculum:
- **Frontend:** Responsive React application bootstrapped with Vite.
- **Backend:** Express.js REST API providing secure, validated HTTP endpoints.
- **Data Persistence:** Key-Value NoSQL database model (supporting Redis on cloud and persistent local file storage).
- **Communication:** Native Fetch API (`window.fetch`) for all client-server communications.
- **Testing:** Automated test suite (`node:test`) validating all endpoints, data integrity, and authentication.

---

## 2. Project URLs & Submission Deliverables

| Deliverable | URL / Status | Notes |
| :--- | :--- | :--- |
| **GitHub Repository** | `https://github.com/<your-username>/coffee-shop-management` | Source code, commit history, documentation |
| **Deployed React Frontend** | `https://aromacraft-coffee.vercel.app` | Hosted on Vercel (or Netlify) |
| **Deployed Express Backend** | `https://aromacraft-api.onrender.com` | Hosted on Render |
| **Health Check Endpoint** | `https://aromacraft-api.onrender.com/api/health` | Returns status: "ok", uptime, and DB info |
| **Persistent NoSQL Database**| Connected (Redis Key-Value / Upstash) | Configured through backend `REDIS_URL` |
| **Staff Credentials** | Password: `barista2024` | Required for Staff Dashboard & Protected APIs |

---

## 3. Group Members and Contribution Breakdown

| Member Name | Student ID | Programme | Role & Key Contributions |
| :--- | :--- | :--- | :--- |
| **Retshepile (Lead)** | *[Student ID]* | BSc. Information Technology | Full-stack architecture, backend Express server design, Key-Value database integration, Render deployment configuration |
| **Team Member 2** | *[Student ID]* | BSc. Information Technology | REST API endpoints development, request validation, CORS and error-handling middleware, automated test suite (`api.test.js`) |
| **Team Member 3** | *[Student ID]* | BSc. Software Engineering | React UI development, responsive component styling (`App.css`), shopping cart state management (`CartContext.jsx`), category filters and search |
| **Team Member 4** | *[Student ID]* | BSc. Software Engineering | Staff portal & kitchen display (`OrderManagement.jsx`, `MenuManagement.jsx`, `DailySummary.jsx`), Fetch API integration, documentation |

---

## 4. Key Functional Features Demonstrated

### 4.1 Customer Experience
1. **Interactive Menu Catalogue:** Customers can browse items organized by category (*Hot Coffee*, *Iced & Cold Brew*, *Artisanal Teas*, *Pastries*). Each card displays high-resolution imagery, name, ingredients/description, price, and real-time stock availability.
2. **Dynamic Search & Stock Filtering:** Live search input allows customers to filter items by name or description instantly, along with an "In-stock only" toggle.
3. **Cart & Price Calculation:** Interactive slide-out cart drawer with increment, decrement, and item removal controls. Automatically recalculates item subtotals, a 5% tax, and total amount due. Cart contents persist in `localStorage`.
4. **Order Placement Modal:** Simple checkout form capturing customer name, order type (*Takeaway* or *Dine-in* with table number), and barista notes (*e.g., Oat milk, extra hot*).
5. **Order Confirmation & Unique Order Number:** Immediate visual confirmation with a unique human-readable order number (*e.g., `ORD-8419`*).
6. **Live Order Status Tracking:** Dedicated tracking view where customers can enter any order number to check progress through a 4-step stepper (*Pending* ➔ *Preparing* ➔ *Ready* ➔ *Collected*).

### 4.2 Staff Dashboard & Kitchen Display
1. **Protected Staff Authentication:** Restricts staff functionality behind password protection (`barista2024`).
2. **Kitchen Order Display:** Live feed of incoming orders displaying item quantities, customer names, dine-in table numbers, and custom notes.
3. **One-Click Order Status Progression:** Baristas can advance orders with a single click (*Start Preparing* ➔ *Mark Ready* ➔ *Mark Collected*).
4. **Menu Management (CRUD):** Staff can add new drinks/pastries, edit prices and descriptions, instantly toggle items between *In Stock* and *Sold Out*, or delete items.
5. **Daily Sales Analytics:** Aggregates total daily revenue, order volumes, status distributions, and highlights the Top 5 best-selling beverages.

---

## 5. Key-Value NoSQL Architecture

In accordance with the assignment guidelines:
- Data is stored in key-value format using distinct key prefixes:
  - `menu:<id>`: Stores the stringified JSON record of a menu item.
  - `order:<id>`: Stores the stringified JSON record of a customer order.
- In production, the system connects to a Redis instance via `ioredis`.
- To allow seamless local development and offline grading, an automatic fallback mirrors records into `data/kv-store.json`, preserving all data across server restarts without requiring a local Redis daemon.

---

## 6. Verification and Automated Testing Results

All 11 automated test cases passed successfully using Node.js's native test runner (`npm test`):

```text
> coffee-shop-backend@1.0.0 test
> node --test tests/api.test.js

✔ 1. GET /api/health should return status: ok and database info (70ms)
✔ 2. GET /api/menu should return existing menu items array (3ms)
✔ 3. Staff Authentication should succeed with valid password and reject invalid (9ms)
✔ 4. POST /api/menu without auth should be rejected with 401 (1ms)
✔ 5. POST /api/menu with staff token should successfully add a new item (3ms)
✔ 6. PUT /api/menu/:id should update menu item details (1ms)
✔ 7. POST /api/orders should allow customer to place an order (1ms)
✔ 8. GET /api/orders/:id should allow tracking an order by ID (1ms)
✔ 9. PATCH /api/orders/:id/status should update order status (1ms)
✔ 10. GET /api/orders/summary should return daily analytics (1ms)
✔ 11. DELETE /api/menu/:id should delete the test menu item (1ms)

ℹ tests 11
ℹ pass 11
ℹ fail 0
```

---

## 7. Step-by-Step Demonstration Script (For Lecturer Evaluation)

When demonstrating the project to Mr. Mofolo or Mr. Takalimane:

1. **Verify Backend Health:**
   - Open browser or terminal to `http://localhost:5000/api/health` (or live Render URL).
   - Point out `status: "ok"` and database connection status.
2. **Customer Browsing & Filtering:**
   - Open the React frontend (`http://localhost:5173`).
   - Switch between category tabs (*Hot Coffee*, *Pastries*).
   - Type *"Caramel"* in the search box to demonstrate real-time search.
3. **Placing an Order:**
   - Add a *Vanilla Cold Brew* and *Butter Croissant* to the cart.
   - Open the cart drawer, increase the Cold Brew quantity to 2, and click *Proceed to Checkout*.
   - Enter Customer Name (*e.g. "Retshepile"*), select *Takeaway*, add note *"Extra napkin"*, and click *Pay & Place Order*.
   - Note the assigned Order Number (*e.g. `ORD-5243`*).
4. **Live Customer Order Tracking:**
   - Click *Track Live Status* on the confirmation modal.
   - Observe the stepper at step 1: **Pending**.
5. **Staff Kitchen Display & Status Update:**
   - Click **🔐 Staff Portal** in the navbar.
   - Enter password `barista2024` and sign in.
   - View the new order under the *Orders & Kitchen* tab.
   - Click **Start Preparing ➔** (status transitions to *Preparing*).
   - In another tab, refresh the customer tracking page to show the stepper moved to *Preparing*.
   - Return to staff portal and click **Mark Ready for Pickup ➔**.
6. **Menu Item CRUD Demonstration:**
   - Switch to the *Menu & Prices* tab.
   - Click **+ Add New Item**, enter *"Lavender Honey Latte"*, price `$4.80`, category *Hot Coffee*, and save.
   - Verify the item appears immediately in the table.
   - Click the stock toggle to switch it from *In Stock* to *Sold Out*.
   - Edit the price to `$4.95`, then delete the test item.
7. **Daily Analytics Review:**
   - Switch to the *Daily Summary* tab.
   - Show the total revenue, order count breakdown, and top-selling beverages.
