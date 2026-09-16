import { useState } from 'react';

function readAdmin() {
  try {
    return JSON.parse(localStorage.getItem('buenisimo-admin') || '{}');
  } catch {
    return {};
  }
}

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState(readAdmin);
  const [saved, setSaved] = useState(false);

  const handleChange = (event) => {
    setSaved(false);
    setAdmin((currentAdmin) => ({
      ...currentAdmin,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem('buenisimo-admin', JSON.stringify(admin));
    setSaved(true);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '680px' }}>
      <h2>Settings</h2>
      <p>Update the profile shown in the management panel.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '1rem' }}>
          <label htmlFor="admin-name">Name</label>
          <input
            id="admin-name"
            name="name"
            value={admin.name || ''}
            onChange={handleChange}
            required
            style={{ padding: '0.75rem', border: '1px solid #d5d5d5', borderRadius: '6px' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '1rem' }}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            value={admin.email || ''}
            onChange={handleChange}
            required
            style={{ padding: '0.75rem', border: '1px solid #d5d5d5', borderRadius: '6px' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '1.25rem' }}>
          <label htmlFor="admin-role">Role</label>
          <input
            id="admin-role"
            name="role"
            value={admin.role || 'Manager'}
            onChange={handleChange}
            style={{ padding: '0.75rem', border: '1px solid #d5d5d5', borderRadius: '6px' }}
          />
        </div>

        <button type="submit" style={{ padding: '0.75rem 1.1rem', border: 0, borderRadius: '6px', background: '#d71920', color: '#fff', cursor: 'pointer' }}>
          Save settings
        </button>
        {saved && <span style={{ marginLeft: '1rem', color: '#2e7d32' }}>Settings saved.</span>}
      </form>
    </div>
  );
}
