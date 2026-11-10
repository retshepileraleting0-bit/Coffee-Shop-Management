/**
 * API Service Module
 * Handles HTTP requests to the backend using native Fetch API.
 */

// Base URL configured via environment variable (or defaults to local backend)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

/**
 * Generic helper wrapper around native fetch
 * @param {string} endpoint - Path relative to API_BASE (e.g. '/menu')
 * @param {object} options  - Native fetch options (method, headers, body)
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`Fetch API Error at [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

// Health check
export async function checkBackendHealth() {
  return await request('/health');
}

// Menu API
export async function getMenuItems(category = '') {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  const result = await request(`/menu${query}`);
  return result.data || [];
}

/**
 * Fetch a single menu item by ID
 * @param {string} id
 */
export async function getMenuItemById(id) {
  const result = await request(`/menu/${id}`);
  return result.data;
}

/**
 * Add a new menu item (Staff Only)
 * @param {object} itemData - { name, category, price, description, available, imageUrl }
 * @param {string} token    - Staff session token
 */
export async function createMenuItem(itemData, token) {
  const result = await request('/menu', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(itemData)
  });
  return result.data;
}

/**
 * Update an existing menu item (Staff Only)
 * @param {string} id
 * @param {object} itemData
 * @param {string} token
 */
export async function updateMenuItem(id, itemData, token) {
  const result = await request(`/menu/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(itemData)
  });
  return result.data;
}

/**
 * Delete a menu item (Staff Only)
 * @param {string} id
 * @param {string} token
 */
export async function deleteMenuItem(id, token) {
  const result = await request(`/menu/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return result;
}

// Orders API
export async function placeCustomerOrder(orderData) {
  const result = await request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  return result.data;
}

/**
 * Look up an order by its unique ID (Customer status tracking & Staff)
 * @param {string} orderId
 */
export async function getOrderById(orderId) {
  const result = await request(`/orders/${encodeURIComponent(orderId)}`);
  return result.data;
}

/**
 * Retrieve customer orders (Staff Only)
 * @param {string} status - Optional filter: 'Pending', 'Preparing', etc.
 * @param {string} token  - Staff session token
 */
export async function getAllOrders(status = '', token) {
  const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
  const result = await request(`/orders${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return result.data || [];
}

/**
 * Update an order's status (Staff Only)
 * @param {string} orderId
 * @param {string} newStatus - 'Pending' | 'Preparing' | 'Ready' | 'Collected'
 * @param {string} token
 */
export async function updateOrderStatus(orderId, newStatus, token) {
  const result = await request(`/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: newStatus })
  });
  return result.data;
}

/**
 * Fetch daily orders summary and revenue totals (Staff Only)
 * @param {string} token
 */
export async function getDailySummary(token) {
  const result = await request('/orders/summary', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return result.data;
}

// Staff auth API
export async function loginStaff(password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
  return result;
}

/**
 * Verify if stored staff session token is valid
 * @param {string} token
 */
export async function verifyStaffSession(token) {
  const result = await request('/auth/verify', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return result;
}

