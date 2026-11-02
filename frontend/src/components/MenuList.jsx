/**
 * ============================================================================
 * MENU LIST COMPONENT
 * ============================================================================
 * Customer-facing menu page. Fetches items from the REST API using the
 * Fetch API service, provides category filtering and live search.
 */

import React, { useEffect, useState } from 'react';
import { getMenuItems } from '../services/api';
import MenuItemCard from './MenuItemCard';

const CATEGORIES = ['All', 'Hot Coffee', 'Iced & Cold Brew', 'Artisanal Teas', 'Pastries'];

export default function MenuList() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load menu items using Fetch API
  const loadMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMenuItems(selectedCategory);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to the coffee shop menu service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [selectedCategory]);

  // Client-side filtering by search query and in-stock checkbox
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = showInStockOnly ? item.available : true;
    return matchesSearch && matchesStock;
  });

  return (
    <div className="menu-page">
      {/* Hero Welcome Banner */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-pill">Freshly Brewed Everyday</span>
          <h1 className="hero-title">Crafted with Passion, Served with Care.</h1>
          <p className="hero-description">
            Explore our curated menu of slow-roasted single-origin coffees, artisanal teas,
            and freshly baked French pastries. Order directly online for dine-in or quick pickup in Maseru!
          </p>
        </div>
      </section>

      {/* Filter and Search Bar Controls */}
      <div className="menu-controls-wrapper">
        <div className="categories-filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="search-and-stock-controls">
          <div className="search-box">
            <span className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search coffee or snacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <label className="stock-toggle-label">
            <input
              type="checkbox"
              checked={showInStockOnly}
              onChange={(e) => setShowInStockOnly(e.target.checked)}
            />
            <span>In-stock only</span>
          </label>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading menu items...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="error-card">
          <p className="error-text">{error}</p>
          <button className="btn-retry" onClick={loadMenu}>
            Try Again
          </button>
        </div>
      )}

      {/* Menu Grid */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="menu-grid">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            </svg>
          </div>
          <h3>No items found</h3>
          <p>Try selecting another category or clearing your search filter.</p>
          <button
            className="btn-reset-filters"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setShowInStockOnly(false);
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

