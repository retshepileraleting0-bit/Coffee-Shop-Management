/**
 * ============================================================================
 * CHECKOUT MODAL COMPONENT
 * ============================================================================
 * Handles customer checkout: collects customer details, sends POST /api/orders
 * request using Fetch API, and displays confirmed order number.
 */

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { placeCustomerOrder } from '../services/api';

export default function CheckoutModal({ isOpen, onClose, onTrackOrder }) {
  const { cartItems, totalAmount, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Takeaway');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  if (!isOpen) return null;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        orderType,
        tableNumber: orderType === 'Dine-in' ? tableNumber.trim() : null,
        notes: notes.trim(),
        items: cartItems.map((i) => ({
          id: i.id,
          quantity: i.quantity
        }))
      };

      const result = await placeCustomerOrder(payload);

      // Successfully placed
      setConfirmedOrder(result);
      clearCart();
    } catch (err) {
      setErrorMessage(err.message || 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedOrder(null);
    setCustomerName('');
    setTableNumber('');
    setNotes('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-dialog checkout-modal" onClick={(e) => e.stopPropagation()}>
        {/* If order is confirmed, show confirmation view */}
        {confirmedOrder ? (
          <div className="order-confirmation-content">
            <div className="confirmation-badge">✓</div>
            <h2 className="confirmation-title">Order Placed Successfully!</h2>
            <p className="confirmation-subtitle">
              Thank you, <strong>{confirmedOrder.customerName}</strong>! Our baristas have received your order.
            </p>

            <div className="order-number-banner">
              <span className="order-number-label">Your Order Number</span>
              <span className="order-number-value">{confirmedOrder.id}</span>
              <span className="order-type-chip">{confirmedOrder.orderType}</span>
            </div>

            <div className="order-summary-box">
              <div className="summary-row">
                <span>Status:</span>
                <span className="status-badge status-pending">{confirmedOrder.status}</span>
              </div>
              <div className="summary-row">
                <span>Total Amount:</span>
                <strong>${Number(confirmedOrder.totalAmount).toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>Items:</span>
                <span>
                  {confirmedOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </span>
              </div>
            </div>

            <p className="tracking-hint">
              💡 Keep your order number handy. You can track preparation status live on the Track Order page!
            </p>

            <div className="confirmation-actions">
              <button
                className="btn-track-now"
                onClick={() => {
                  handleClose();
                  onTrackOrder(confirmedOrder.id);
                }}
              >
                Track Live Status →
              </button>
              <button className="btn-close-modal" onClick={handleClose}>
                Back to Menu
              </button>
            </div>
          </div>
        ) : (
          /* Normal Checkout Form */
          <div className="checkout-form-content">
            <div className="modal-header">
              <h2>Complete Your Order</h2>
              <button className="btn-close-modal-icon" onClick={handleClose}>
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="form-error-banner">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="checkout-form">
              {/* Customer Name */}
              <div className="form-group">
                <label htmlFor="customerName">
                  Your Name <span className="required">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  placeholder="e.g. Retshepile / Sarah"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Order Type */}
              <div className="form-group">
                <label>Order Preference</label>
                <div className="radio-tile-group">
                  <label className={`radio-tile ${orderType === 'Takeaway' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="orderType"
                      value="Takeaway"
                      checked={orderType === 'Takeaway'}
                      onChange={() => setOrderType('Takeaway')}
                    />
                    <span>🥡 Takeaway / Pickup</span>
                  </label>
                  <label className={`radio-tile ${orderType === 'Dine-in' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="orderType"
                      value="Dine-in"
                      checked={orderType === 'Dine-in'}
                      onChange={() => setOrderType('Dine-in')}
                    />
                    <span>🍽️ Dine-in Table</span>
                  </label>
                </div>
              </div>

              {/* Table Number if Dine-in */}
              {orderType === 'Dine-in' && (
                <div className="form-group">
                  <label htmlFor="tableNumber">Table Number (Optional)</label>
                  <input
                    id="tableNumber"
                    type="text"
                    placeholder="e.g. Table 4"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="form-group">
                <label htmlFor="notes">Special Barista Instructions</label>
                <textarea
                  id="notes"
                  rows="2"
                  placeholder="e.g. Oat milk, extra hot, less sugar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Order summary bar */}
              <div className="checkout-total-bar">
                <span>Items in Order ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
                <span className="total-price-large">${totalAmount.toFixed(2)}</span>
              </div>

              {/* Submit Buttons */}
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-order" disabled={submitting}>
                  {submitting ? 'Placing Order...' : `Pay & Place Order ($${totalAmount.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

