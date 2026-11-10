// Daily sales summary and analytics
import React, { useState, useEffect } from 'react';
import { getDailySummary } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DailySummary() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDailySummary(token);
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load order summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="management-panel">
      <div className="panel-header-row">
        <div>
          <h3>Store Analytics & Daily Summary</h3>
          <p className="panel-subtitle">
            Overview of daily order totals, revenue, and best-selling beverages.
          </p>
        </div>
        <button className="btn-refresh-orders" onClick={loadSummary} disabled={loading}>
          Refresh Stats
        </button>
      </div>

      {error && <div className="action-error-banner">{error}</div>}

      {loading && !summary ? (
        <div className="panel-loading">Calculating store metrics...</div>
      ) : summary ? (
        <div className="analytics-content">
          {/* Key Metric Cards */}
          <div className="metrics-grid">
            <div className="metric-card metric-revenue">
              <span className="metric-label">Total Revenue</span>
              <h2 className="metric-value">M{Number(summary.totalRevenue || 0).toFixed(2)}</h2>
              <small className="metric-note">Gross sales in Maloti including tax</small>
            </div>

            <div className="metric-card metric-orders">
              <span className="metric-label">Total Orders</span>
              <h2 className="metric-value">{summary.totalOrders || 0}</h2>
              <small className="metric-note">Recorded in Key-Value store</small>
            </div>

            <div className="metric-card metric-pending">
              <span className="metric-label">Pending / Active</span>
              <h2 className="metric-value">
                {(summary.statusCounts?.Pending || 0) + (summary.statusCounts?.Preparing || 0)}
              </h2>
              <small className="metric-note">Needs kitchen preparation</small>
            </div>

            <div className="metric-card metric-ready">
              <span className="metric-label">Ready for Pickup</span>
              <h2 className="metric-value">{summary.statusCounts?.Ready || 0}</h2>
              <small className="metric-note">Awaiting customer collection</small>
            </div>
          </div>

          {/* Breakdown & Popular Items */}
          <div className="analytics-two-col">
            {/* Order Status Distribution */}
            <div className="analytics-box">
              <h4>Order Status Distribution</h4>
              <div className="status-bars-list">
                {Object.entries(summary.statusCounts || {}).map(([status, count]) => {
                  const percentage =
                    summary.totalOrders > 0
                      ? Math.round((count / summary.totalOrders) * 100)
                      : 0;

                  return (
                    <div key={status} className="status-bar-row">
                      <div className="status-bar-labels">
                        <span className="status-name">{status}</span>
                        <span className="status-count">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill fill-${status.toLowerCase()}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 Popular Menu Items */}
            <div className="analytics-box">
              <h4>Top Selling Items</h4>
              {summary.popularItems && summary.popularItems.length > 0 ? (
                <ul className="popular-items-list">
                  {summary.popularItems.map((item, index) => (
                    <li key={item.name} className="popular-item-row">
                      <span className="popular-rank">#{index + 1}</span>
                      <span className="popular-name">{item.name}</span>
                      <span className="popular-count-pill">{item.count} ordered</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-sub-state">
                  <p>No orders recorded yet today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="analytics-footer-meta">
            <small>
              Report generated at: {new Date(summary.generatedAt).toLocaleString()}
            </small>
          </div>
        </div>
      ) : null}
    </div>
  );
}

