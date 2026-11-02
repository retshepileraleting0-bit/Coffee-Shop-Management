/**
 * ============================================================================
 * STAFF MENU MANAGEMENT COMPONENT
 * ============================================================================
 * Allows staff to add new menu items, edit existing items, toggle stock
 * availability, and delete items from the Key-Value NoSQL database.
 */

import React, { useState, useEffect } from 'react';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Hot Coffee', 'Iced & Cold Brew', 'Artisanal Teas', 'Pastries'];

export default function MenuManagement() {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if adding new
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hot Coffee',
    price: '',
    description: '',
    available: true,
    imageUrl: ''
  });

  // Load menu items
  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await getMenuItems();
      setMenuItems(data);
    } catch (err) {
      setActionError(err.message || 'Failed to fetch menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Hot Coffee',
      price: '',
      description: '',
      available: true,
      imageUrl: ''
    });
    setActionError('');
    setActionSuccess('');
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      available: item.available,
      imageUrl: item.imageUrl || ''
    });
    setActionError('');
    setActionSuccess('');
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      if (editingItem) {
        // Update existing item
        await updateMenuItem(editingItem.id, formData, token);
        setActionSuccess(`Updated '${formData.name}' successfully.`);
      } else {
        // Create new item
        await createMenuItem(formData, token);
        setActionSuccess(`Added '${formData.name}' to the menu.`);
      }

      setIsModalOpen(false);
      loadMenu();
    } catch (err) {
      setActionError(err.message || 'Failed to save menu item.');
    }
  };

  // Toggle availability directly
  const handleToggleAvailability = async (item) => {
    try {
      await updateMenuItem(item.id, { available: !item.available }, token);
      loadMenu();
    } catch (err) {
      setActionError(err.message || 'Failed to update stock status.');
    }
  };

  // Delete item with confirmation
  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${item.name}" from the menu?`);
    if (!confirmed) return;

    try {
      await deleteMenuItem(item.id, token);
      setActionSuccess(`Deleted '${item.name}' from menu.`);
      loadMenu();
    } catch (err) {
      setActionError(err.message || 'Could not delete item.');
    }
  };

  return (
    <div className="management-panel">
      <div className="panel-header-row">
        <div>
          <h3>Menu Items Management</h3>
          <p className="panel-subtitle">
            Add new beverages and pastries, update prices, and control stock availability.
          </p>
        </div>
        <button className="btn-primary-add" onClick={handleOpenAdd}>
          + Add New Item
        </button>
      </div>

      {actionSuccess && <div className="action-success-banner">{actionSuccess}</div>}
      {actionError && <div className="action-error-banner">{actionError}</div>}

      {/* Menu Table */}
      {loading ? (
        <div className="panel-loading">Loading current menu...</div>
      ) : (
        <div className="table-responsive">
          <table className="management-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.id}>
                  <td className="item-cell">
                    <img src={item.imageUrl} alt={item.name} className="table-thumb" />
                    <div>
                      <strong>{item.name}</strong>
                      <small className="item-desc-preview">{item.description}</small>
                    </div>
                  </td>
                  <td>
                    <span className="category-pill">{item.category}</span>
                  </td>
                  <td className="price-cell">
                    <strong>M{Number(item.price).toFixed(2)}</strong>
                  </td>
                  <td>
                    <button
                      className={`badge-stock-toggle ${item.available ? 'in-stock' : 'out-of-stock'}`}
                      onClick={() => handleToggleAvailability(item)}
                      title="Click to toggle availability"
                    >
                      {item.available ? 'In Stock' : 'Sold Out'}
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-action-edit"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Item"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action-delete"
                      onClick={() => handleDeleteItem(item)}
                      title="Delete Item"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button className="btn-close-modal-icon" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="management-form">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vanilla Flat White"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (Maloti - M) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1.00"
                    placeholder="35.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, flavour profile or serving size..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  />
                  <span>Mark as available in stock</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-order">
                  {editingItem ? 'Save Changes' : 'Create Menu Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

