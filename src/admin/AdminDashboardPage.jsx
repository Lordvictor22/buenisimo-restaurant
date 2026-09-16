import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState({
    todaySales: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    recentOrders: [], // suporte a lista de pedidos recentes
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        // Tenta buscar o token do localStorage (testando as duas chaves mais comuns)
        const token =
          localStorage.getItem('buenisimo-admin-token') ||
          localStorage.getItem('adminToken') ||
          localStorage.getItem('token');

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        const API_URL =
          import.meta.env.VITE_API_URL || 'http://localhost:4242/api';

        const response = await fetch(`${API_URL}/admin/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        // Trata token expirado/inválido (401 ou 403)
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('buenisimo-admin-token');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          throw new Error('Session expired. Please log in again.');
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load dashboard.');
        }

        setDashboard((prev) => ({
          ...prev,
          ...data.dashboard,
          recentOrders: data.dashboard?.recentOrders || [],
        }));
      } catch (error) {
        console.error('Dashboard loading error:', error);
        setError(error.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <div>
            <h2>Dashboard</h2>
            <p>Overview of your restaurant today.</p>
          </div>
        </div>

        <div className="admin-dashboard-loading">
          <div className="admin-dashboard-skeleton" />
          <div className="admin-dashboard-skeleton" />
          <div className="admin-dashboard-skeleton" />
          <div className="admin-dashboard-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your restaurant today.</p>
        </div>

        <span className="admin-dashboard-date">Today</span>
      </div>

      {error && (
        <div className="admin-dashboard-error" role="alert">
          {error}
        </div>
      )}

      {/* METRICS GRID */}
      <div className="admin-dashboard-metrics">
        <div className="admin-dashboard-card sales">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">Today's Sales</span>
            <span className="admin-dashboard-card-icon">$</span>
          </div>
          <p className="admin-dashboard-card-value">
            ${Number(dashboard.todaySales || 0).toFixed(2)}
          </p>
          <p className="admin-dashboard-card-description">
            Sales generated today
          </p>
        </div>

        <div className="admin-dashboard-card orders">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">Orders Today</span>
            <span className="admin-dashboard-card-icon">#</span>
          </div>
          <p className="admin-dashboard-card-value">{dashboard.todayOrders}</p>
          <p className="admin-dashboard-card-description">
            Orders received today
          </p>
        </div>

        <div className="admin-dashboard-card pending">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">Pending Orders</span>
            <span className="admin-dashboard-card-icon">!</span>
          </div>
          <p className="admin-dashboard-card-value">{dashboard.pendingOrders}</p>
          <p className="admin-dashboard-card-description">
            Orders needing attention
          </p>
        </div>

        <div className="admin-dashboard-card customers">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">Customers</span>
            <span className="admin-dashboard-card-icon">U</span>
          </div>
          <p className="admin-dashboard-card-value">{dashboard.totalCustomers}</p>
          <p className="admin-dashboard-card-description">
            Customers with orders
          </p>
        </div>
      </div>

      {/* LOWER GRID */}
      <div className="admin-dashboard-grid">

        {/* RECENT ORDERS PANEL */}
        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h3>Recent Orders</h3>
            <span>Latest activity</span>
          </div>

          {!dashboard.recentOrders || dashboard.recentOrders.length === 0 ? (
            <div className="admin-dashboard-empty">
              <div className="admin-dashboard-empty-icon">#</div>
              <strong>No orders found for today</strong>
              <p>New orders will appear here automatically when created.</p>
            </div>
          ) : (
            <div className="admin-dashboard-orders-list">
              {dashboard.recentOrders.map((order) => (
                <div key={order.id} className="admin-dashboard-order-item">
                  <div>
                    <strong>Order #{order.id}</strong>
                    <p>{order.customer_name || 'Guest Customer'}</p>
                  </div>
                  <div>
                    <span>${Number(order.total_price || 0).toFixed(2)}</span>
                    <small className={`status-${order.status?.toLowerCase()}`}>
                      {order.status}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* QUICK ACTIONS PANEL */}
        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h3>Quick Actions</h3>
            <span>Manage</span>
          </div>

          <div className="admin-dashboard-actions">
            <button
              type="button"
              className="admin-dashboard-action"
              onClick={() => navigate('/admin/products')}
            >
              <span>Manage Products</span>
              <span className="admin-dashboard-action-arrow">→</span>
            </button>

            <button
              type="button"
              className="admin-dashboard-action"
              onClick={() => navigate('/admin/orders')}
            >
              <span>View Orders</span>
              <span className="admin-dashboard-action-arrow">→</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}