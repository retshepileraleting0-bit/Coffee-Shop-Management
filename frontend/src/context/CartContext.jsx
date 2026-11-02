/**
 * ============================================================================
 * CART CONTEXT: State Management for Shopping Cart
 * ============================================================================
 * Manages items added by the customer, quantities, subtotal, tax and total.
 * Persists cart state in localStorage for a smooth user experience.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aroma_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      localStorage.setItem('aroma_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Could not save cart to storage:', err);
    }
  }, [cartItems]);

  /**
   * Add item to cart or increment quantity if already present
   */
  const addToCart = (item) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.id === item.id);
      if (existing) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  /**
   * Update quantity of an item
   */
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i))
    );
  };

  /**
   * Remove item from cart completely
   */
  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  };

  /**
   * Clear all items in cart
   */
  const clearCart = () => {
    setCartItems([]);
  };

  // Computations
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = parseFloat(
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 5% tax
  const totalAmount = parseFloat((subtotal + tax).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        subtotal,
        tax,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
