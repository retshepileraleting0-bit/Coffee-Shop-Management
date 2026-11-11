# AromaCraft  Coffee Shop Management Web Application
> **Course:** Web Application Development  
> **Faculty:** FICT  
> **Departments:** BSc.IT  Year 2 Semster 1 
> **Assignment:** Group Assignment 
> **Lecturers:** Mr. Tshepo Mofolo  


## 1. Project Overview & Scenario
**AromaCraft** is a modern, responsive full-stack web application designed for an artisanal coffee shop based in Maseru, Lesotho. Before this system, staff took orders manually using pen and paper, which caused miscommunications, price discrepancies, and confusion over which orders were pending, currently being prepared, or ready for customer collection.

This application provides:
1. **Customer Web Interface**: Allows customers to explore hot coffees, iced cold brews, artisanal teas, and fresh pastries priced in Lesotho Loti (LSL / M); view live stock availability and pricing; add items to a shopping cart; customize their order (takeaway vs. dine-in with table numbers and special notes); place an order; and track live preparation progress using a unique Order Number (`ORD-XXXX`).
2. **Staff Kitchen & Manager Portal**: Secure dashboard protected with staff credentials allowing baristas to view incoming orders in real time, advance orders through their lifecycle (`Pending` -> `Preparing` -> `Ready` -> `Collected`), manage menu items (create new items, edit names/prices/descriptions, toggle stock availability, and delete items), and review daily order totals and sales analytics.
3. **Key-Value NoSQL Database**: Stores menu items and orders using unique keys and JSON values. Built with seamless dual-mode persistence (Redis for cloud hosting on Render + persistent disk storage for frictionless local evaluation).


## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Component-driven UI, responsive layout, client-side routing and state management |
| **Backend** | Express.js (Node.js) | RESTful API server, middleware validation, CORS handling, business logic |
| **Data Layer** | Key-Value NoSQL (Redis) | High-speed key-value persistence for menu items and orders using serialized JSON |
| **Integration** | Native Fetch API | Browser-native asynchronous HTTP client (`window.fetch`) without external HTTP libraries |
| **Authentication** | Bearer Token Middleware | Protects administrative staff endpoints (menu modification, order updates) |
| **Testing** | Node.js Built-in Runner (`node:test`) | Automated endpoint testing for CRUD, order workflows, and auth |
| **Hosting** | Render (Backend) + Vercel / Netlify (Frontend) | Independent cloud deployment with environment variable configuration |


## 3. System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React + Vite)"]
        UI["Customer Interface\n(Menu, Cart, Live Tracker)"]
        StaffUI["Staff Portal\n(Kitchen Display, Menu CRUD, Summary)"]
        FetchModule["Fetch API Service (services/api.js)"]
        UI --> FetchModule
        StaffUI --> FetchModule
    end

    subgraph Server ["Backend Layer (Express.js on Render)"]
        Router["Express Router & Middleware\n(CORS, Auth, Validation)"]
        MenuRoute["/api/menu Routes"]
        OrderRoute["/api/orders Routes"]
        AuthRoute["/api/auth Routes"]
        HealthRoute["/api/health Route"]
        
        Router --> MenuRoute
        Router --> OrderRoute
        Router --> AuthRoute
        Router --> HealthRoute
    end

    subgraph Storage ["Data Storage Layer (Key-Value NoSQL)"]
        KVAdapter["Key-Value Adapter (config/db.js)"]
        RedisDB[("Redis NoSQL Database\n(Render / Upstash Cloud)")]
        FileDB[("Persistent Local KV Store\n(data/kv-store.json)")]
        
        KVAdapter -->|Cloud Mode| RedisDB
        KVAdapter -->|Local Offline Mode| FileDB
    end

    FetchModule <-->|HTTP JSON Requests / REST| Router
    MenuRoute <--> KVAdapter
    OrderRoute <--> KVAdapter
```

## 4. Key-Value NoSQL Database Design

As required by the assignment guidelines, the database is designed according to **Key-Value NoSQL** architecture:
- Every record is stored under a distinct key prefix.
- Values are stored as stringified JSON objects.

| Key Pattern | Value Type | Description |
| :--- | :--- | :--- |
| `menu:<id>` | JSON String | Contains item ID, name, category, price, description, availability, and image URL. |
| `order:<id>` | JSON String | Contains unique order ID (`ORD-XXXX`), customer name, order type, table number, notes, item list, subtotal, tax, total, status, and timestamps. |

### Data Model Samples

#### Menu Item Key: `menu:menu-1`
```json
{
  "id": "menu-1",
  "name": "Classic Espresso",
  "category": "Hot Coffee",
  "price": 25.00,
  "description": "Rich, concentrated shot of freshly roasted Arabica beans with a thick golden crema.",
  "available": true,
  "imageUrl": "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400"
}
```

#### Order Key: `order:ORD-4821`
```json
{
  "id": "ORD-4821",
  "customerName": "Alice Cooper",
  "orderType": "Takeaway",
  "tableNumber": null,
  "notes": "Extra hot, oat milk please",
  "items": [
    {
      "id": "menu-1",
      "name": "Classic Espresso",
      "price": 25.00,
      "quantity": 2,
      "lineTotal": 50.00
    }
  ],
  "subtotal": 50.00,
  "tax": 2.50,
  "totalAmount": 52.50,
  "status": "Pending",
  "createdAt": "2026-11-02T13:20:00.000Z",
  "updatedAt": "2026-11-02T13:20:00.000Z"
}
```


## 5. REST API Endpoints Specification

| Method | Endpoint | Access | Purpose | Success Code |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | System availability check and database connectivity status | `200 OK` |
| **POST** | `/api/auth/login` | Public | Staff login with password, returns session token | `200 OK` |
| **GET** | `/api/menu` | Public | Retrieve all menu items (optional `?category=` filter) | `200 OK` |
| **GET** | `/api/menu/:id` | Public | Retrieve a specific menu item by its ID | `200 OK` |
| **POST** | `/api/menu` | Staff Only | Create a new menu item | `201 Created` |
| **PUT** | `/api/menu/:id` | Staff Only | Update an existing menu item (name, price, stock, etc.) | `200 OK` |
| **DELETE** | `/api/menu/:id` | Staff Only | Delete a menu item from the catalogue | `200 OK` |
| **GET** | `/api/orders` | Staff Only | Retrieve all customer orders (optional `?status=` filter) | `200 OK` |
| **GET** | `/api/orders/summary` | Staff Only | Get daily sales analytics, revenue total, and status breakdown | `200 OK` |
| **GET** | `/api/orders/:id` | Public | Look up order details and live status using unique Order ID | `200 OK` |
| **POST** | `/api/orders` | Public | Place a new customer order with validated item prices | `201 Created` |
| **PATCH** | `/api/orders/:id/status`| Staff Only | Update order status (`Pending` -> `Preparing` -> `Ready` -> `Collected`) | `200 OK` |


## 6. Local Setup and Installation

### Prerequisites
- Node.js (version 18 or newer recommended)
- npm (Node Package Manager)
- *(Optional)* Redis server or Upstash account (application automatically uses persistent local file storage if Redis is not configured).

### Step 1: Clone the Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd "Group Assignment"
```

### Step 2: Set Up Backend
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start the Express server
npm start
```
*The backend will boot up at `http://localhost:5001`.*  
*You can verify backend health by visiting `http://localhost:5001/api/health` in your browser.*

### Step 3: Run Automated Backend Tests
In a separate terminal:
```bash
cd backend
npm test
```
*All 11 automated test suites will execute, verifying API endpoints, security, order creation, status lifecycle, and data persistence.*

### Step 4: Set Up Frontend
```bash
# In another terminal window:
cd frontend

# Install dependencies
npm install

# Start Vite React development server
npm run dev
```
*The React frontend will be accessible at `http://localhost:5173`.*


## 7. Staff Credentials for Evaluation
- **Staff Password / PIN:** `barista2024`
- You can access the staff dashboard by clicking the **"Staff Portal"** button in the navigation bar.


## 8. Deployment Guide

### Deploying the Backend on Render
1. Create a free account at [render.com](https://render.com).
2. Click **New +** -> **Web Service** and connect your GitHub repository.
3. Configure the service settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add the following **Environment Variables** in Render:
   - `PORT`: `5001`
   - `STAFF_PASSWORD`: `barista2024`
   - `FRONTEND_URL`: `https://your-frontend-app.vercel.app` (or `*`)
   - `REDIS_URL`: *(Optional)* Your Upstash or Redis Cloud URL (e.g., `rediss://default:xxxxx@xxxx.upstash.io:6379`). If left blank, the backend runs in persistent file storage mode.
5. Deploy and verify that `https://your-backend.onrender.com/api/health` returns status `ok`.

### Deploying the Frontend on Vercel or Netlify
1. Create a free account on [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com).
2. Import your GitHub repository.
3. Configure the build settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the **Environment Variable**:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`
5. Deploy and test the live website URL.

## 9. Group Members & Contribution

| Student Name | Student ID | Department | Main Contribution |
| :--- | :--- | :--- | :--- |
| **Member 1 (Lead)** | *[Student ID]* | Information Technology | Backend Express REST API architecture, routes, database adapter |
| **Member 2** | *[Student ID]* | Information Technology | Key-Value NoSQL database schema, automated test suite, error handling |
| **Member 3** | *[Student ID]* | Software Engineering | React frontend user interface, menu browsing, cart context, modal flow |
| **Member 4** | *[Student ID]* | Software Engineering | Staff dashboard, live order tracking, Fetch API integration, documentation |

# Coffee-Shop-Management
