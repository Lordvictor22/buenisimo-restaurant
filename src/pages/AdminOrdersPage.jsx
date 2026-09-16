import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem('buenisimo-admin-token') ||
          localStorage.getItem('adminToken') ||
          localStorage.getItem('token');

        const API_URL =
          import.meta.env.VITE_API_URL || 'http://localhost:4242/api';

        const response = await fetch(`${API_URL}/admin/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('buenisimo-admin-token');
          localStorage.removeItem('buenisimo-admin');
          navigate('/admin/login', { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch orders.');
        }

        setOrders(data.orders || data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Error loading orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return orders;

    return orders.filter((order) =>
      [order.customer_name, order.customer_email, order.id]
        .some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
    );
  }, [orders, searchTerm]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading orders...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2>Orders Management</h2>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by customer name"
          aria-label="Search orders by customer name"
          style={{ minWidth: '250px', padding: '0.7rem 0.85rem', border: '1px solid #d5d5d5', borderRadius: '6px' }}
        />
      </div>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : filteredOrders.length === 0 ? (
        <p>No orders match your search.</p>
      ) : (
        <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id || order._id}>
                <td>#{order.id || order._id}</td>
                <td>{order.customer_name || order.customerEmail || 'Guest'}</td>
                <td>${Number(order.total_price || order.totalAmount || 0).toFixed(2)}</td>
                <td>{order.status || 'Pending'}</td>
                <td>{new Date(order.created_at || order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}