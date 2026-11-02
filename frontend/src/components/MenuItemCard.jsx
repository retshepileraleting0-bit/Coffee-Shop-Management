/**
 * ============================================================================
 * MENU ITEM CARD COMPONENT
 * ============================================================================
 * Displays a single coffee or pastry item with its name, description, price,
 * availability status, and Add-to-Cart action.
 */

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function MenuItemCard({ item }) {
  const { addToCart, cartItems } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  // Check how many of this item are already in the cart
  const cartEntry = cartItems.find((i) => i.id === item.id);
  const currentQuantityInCart = cartEntry ? cartEntry.quantity : 0;

  const handleAddToCart = () => {
    if (!item.available) return;
    addToCart(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <div className={`menu-card ${!item.available ? 'out-of-stock' : ''}`}>
      {/* Image thumbnail */}
      <div className="card-image-wrap">
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80'}
          alt={item.name}
          className="card-image"
          loading="lazy"
        />
        <span className="card-category-tag">{item.category}</span>
        {!item.available && (
          <div className="sold-out-overlay">
            <span>Sold Out</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="card-body">
        <div className="card-header">
          <h3 className="card-title">{item.name}</h3>
          <span className="card-price">M{Number(item.price).toFixed(2)}</span>
        </div>

        <p className="card-description">{item.description}</p>

        {/* Footer with availability and Add Button */}
        <div className="card-footer">
          <span className={`availability-indicator ${item.available ? 'available' : 'unavailable'}`}>
            <span className="dot"></span>
            {item.available ? 'In Stock' : 'Sold Out'}
          </span>

          <button
            className={`btn-add-cart ${justAdded ? 'added-success' : ''}`}
            onClick={handleAddToCart}
            disabled={!item.available}
          >
            {justAdded ? (
              'Added'
            ) : currentQuantityInCart > 0 ? (
              `Add More (${currentQuantityInCart})`
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

