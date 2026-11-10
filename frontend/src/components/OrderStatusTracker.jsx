// Order status tracker component
import React, { useState, useEffect } from 'react';
import { getOrderById } from '../services/api';

const ORDER_STEPS = ['Pending', 'Preparing', 'Ready', 'Collected'];

export default function OrderStatusTracker({ initialOrderId = '' }) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (idToSearch) => {
    const searchTarget = idToSearch || orderIdInput;
    if (!searchTarget || searchTarget.trim() === '') {
      setError('Please enter an order number (e.g. ORD-1001).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getOrderById(searchTarget.trim());
      setOrderData(data);
    } catch (err) {
      setError(err.message || 'Order not found. Please double-check your order number.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  // If navigated with an initialOrderId, auto-fetch
  useEffect(() => {
    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
      handleLookup(initialOrderId);
    }
  }, [initialOrderId]);

  // Helper to determine step active/completed state
  const getCurrentStepIndex = () => {
    if (!orderData) return -1;
    return ORDER_STEPS.indexOf(orderData.status);
  };

  return (
    <div className="tracker-page">
      <div className="tracker-card">
        <div className="tracker-header">
          <h2>Track Your Coffee Order</h2>
          <p>Enter your order number below to check its real-time preparation status.</p>
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="tracker-input-form"
        >
          <input
            type="text"
            placeholder="e.g. ORD-4821"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            className="tracker-input"
          />
          <button type="submit" className="btn-search-order" disabled={loading}>
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </form>

        {error && <div className="tracker-error">{error}</div>}

        {/* Order Details and Visual Status Tracker */}
        {orderData && (
          <div className="order-details-container">
            <div className="order-meta-header">
              <div>
                <span className="order-meta-id">{orderData.id}</span>
                <span className="order-meta-customer">Placed for: {orderData.customerName}</span>
              </div>
              <button
                className="btn-refresh-status"
                onClick={() => handleLookup(orderData.id)}
                title="Check for newest status"
              >
                Refresh
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="order-stepper">
              {ORDER_STEPS.map((step, idx) => {
                const currentIdx = getCurrentStepIndex();
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={step}
                    className={`step-item ${isCompleted ? 'completed' : ''} ${
                      isCurrent ? 'current' : ''
                    }`}
                  >
                    <div className="step-circle">
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className="step-label">{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Current Status Banner */}
            <div className={`status-callout status-${orderData.status.toLowerCase()}`}>
              {orderData.status === 'Pending' && 'Order received. It will be sent to the barista shortly.'}
              {orderData.status === 'Preparing' && 'Your coffee and treats are being freshly brewed right now.'}
              {orderData.status === 'Ready' && 'Your order is ready for pickup at the counter.'}
              {orderData.status === 'Collected' && 'Order complete. Enjoy your coffee and have a great day.'}
            </div>

            {/* Order Items Breakdown */}
            <div className="tracker-items-list">
              <h4>Items in this order:</h4>
              <ul>
                {orderData.items.map((item, index) => (
                  <li key={index} className="tracker-item-row">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>M{Number(item.lineTotal || item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="tracker-order-total">
                <span>Total Paid:</span>
                <strong>M{Number(orderData.totalAmount).toFixed(2)}</strong>
              </div>
            </div>

            {orderData.notes && (
              <div className="tracker-notes">
                <strong>Special Note:</strong> <em>"{orderData.notes}"</em>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

