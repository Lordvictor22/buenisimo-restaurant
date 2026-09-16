import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4242/api';

export default function AdminCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const token = localStorage.getItem('buenisimo-admin-token');
        const response = await fetch(`${API_URL}/admin/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('buenisimo-admin-token');
          localStorage.removeItem('buenisimo-admin');
          navigate('/admin/login', { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load customers.');
        }

        setCustomers(data.customers || []);
      } catch (loadError) {
        console.error('Customers loading error:', loadError);
        setError(loadError.message || 'Unable to load customers.');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [navigate]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return customers;

    return customers.filter((customer) =>
      [customer.customer_name, customer.customer_email]
        .some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
    );
  }, [customers, searchTerm]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading customers...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#c62828' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2>Customers</h2>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search customers by name or email"
          style={{ minWidth: '250px', padding: '0.7rem 0.85rem', border: '1px solid #d5d5d5', borderRadius: '6px' }}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <p>{customers.length === 0 ? 'No customers found.' : 'No customers match your search.'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.customer_email}>
                  <td>{customer.customer_name || 'Guest'}</td>
                  <td>{customer.customer_email}</td>
                  <td>{customer.order_count}</td>
                  <td>${Number(customer.total_spent || 0).toFixed(2)}</td>
                  <td>{new Date(customer.last_order_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
