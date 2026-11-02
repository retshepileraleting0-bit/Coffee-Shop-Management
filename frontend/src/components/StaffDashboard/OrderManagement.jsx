/**
 * ============================================================================
 * STAFF ORDER MANAGEMENT COMPONENT
 * ============================================================================
 * Real-time order kitchen display and status manager.
 * Allows baristas to track incoming orders, see customer notes/table numbers,
 * and update order statuses: Pending -> Preparing -> Ready -> Collected.
 */

import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = ['All', 'Pending', 'Preparing', 'Ready', 'Collected'];

export default function OrderManagement() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setActionError('');
    try {
      const data = await getAllOrders(selectedStatus, token);
      setOrders(data);
    } catch (err) {
      setActionError(err.message || 'Failed to load customer orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Auto refresh every 15 seconds for kitchen display
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [selectedStatus]);

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, token);
      // Update local state directly for snappy UI
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      setActionError(err.message || `Could not update status to ${newStatus}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="management-panel">
      {/* Panel Top Controls */}
      <div className="panel-header-row">
        <div>
          <h3>Live Orders & Kitchen Display</h3>
          <p className="panel-subtitle">
            Manage incoming orders and advance their preparation workflow.
          </p>
        </div>
        <button className="btn-refresh-orders" onClick={loadOrders} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {actionError && <div className="action-error-banner">⚠️ {actionError}</div>}

      {/* Status Filter Tabs */}
      <div className="status-filter-pills">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            className={`status-pill-btn ${selectedStatus === status ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List / Cards */}
      {loading && orders.length === 0 ? (
        <div className="panel-loading">Fetching customer orders...</div>
      ) : orders.length === 0 ? (
        <div className="empty-orders-state">
          <span>☕</span>
          <h4>No orders in this category</h4>
          <p>New customer orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`order-card-staff status-border-${order.status.toLowerCase()}`}
            >
              {/* Order Card Header */}
              <div className="order-card-header">
                <div>
                  <span className="order-id-badge">{order.id}</span>
                  <span className="order-type-tag">
                    {order.orderType === 'Dine-in'
                      ? `🍽️ Table ${order.tableNumber || 'N/A'}`
                      : '🥡 Takeaway'}
                  </span>
                </div>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              {/* Customer Details */}
              <div className="order-card-customer">
                <h4>{order.customerName}</h4>
                <small className="order-time">
                  Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>

              {/* Special Notes if any */}
              {order.notes && (
                <div className="order-staff-notes">
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}

              {/* Items Breakdown */}
              <div className="order-items-breakdown">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-line">
                    <span className="item-qty-badge">{item.quantity}x</span>
                    <span className="item-name-text">{item.name}</span>
                    <span className="item-price-text">
                      ${Number(item.lineTotal || item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="order-card-total">
                <span>Total Due</span>
                <strong>${Number(order.totalAmount).toFixed(2)}</strong>
              </div>

              {/* Status Progression Workflow Actions */}
              <div className="order-status-actions">
                {order.status === 'Pending' && (
                  <button
                    className="btn-status-progress progress-prep"
                    disabled={updatingId === order.id}
                    onClick={() => handleStatusChange(order.id, 'Preparing')}
                  >
                    Start Preparing ➔
                  </button>
                )}

                {order.status === 'Preparing' && (
                  <button
                    className="btn-status-progress progress-ready"
                    disabled={updatingId === order.id}
                    onClick={() => handleStatusChange(order.id, 'Ready')}
                  >
                    Mark Ready for Pickup ➔
                  </button>
                )}

                {order.status === 'Ready' && (
                  <button
                    className="btn-status-progress progress-collected"
                    disabled={updatingId === order.id}
                    onClick={() => handleStatusChange(order.id, 'Collected')}
                  >
                    Mark Collected / Complete ✓
                  </button>
                )}

                {order.status === 'Collected' && (
                  <div className="order-completed-indicator">
                    ✓ Completed & Picked Up
                  </div>
                )}

                {/* Dropdown to jump directly if needed */}
                <div className="status-dropdown-wrap">
                  <label>Change status:</label>
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Collected">Collected</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
