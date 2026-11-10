// Slide-out shopping cart drawer
import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartDrawer({ isOpen, onClose, onOpenCheckout }) {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal, tax, totalAmount } = useCart();

  if (!isOpen) return null;

  return (
    <div className="cart-backdrop" onClick={onClose}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <h2>Order Basket</h2>
          </div>
          <button className="btn-close-drawer" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty-message">
              <div className="empty-cart-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <h3>Your basket is empty</h3>
              <p>Add some fresh coffee or a warm croissant from the menu.</p>
              <button className="btn-browse-menu" onClick={onClose}>
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <span className="cart-item-unit-price">M{Number(item.price).toFixed(2)} each</span>
                    <div className="cart-qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        className="btn-remove-item"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    M{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer / Checkout summary */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="summary-breakdown">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>M{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-line">
                <span>Estimated Tax (5%)</span>
                <span>M{tax.toFixed(2)}</span>
              </div>
              <div className="summary-line total-line">
                <span>Total Due</span>
                <span>M{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="drawer-actions">
              <button className="btn-clear-cart" onClick={clearCart}>
                Clear
              </button>
              <button
                className="btn-proceed-checkout"
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

