import React, { useState } from 'react';
import logoBuenisimo from '../assets/images/LogoBuenisimo123.png';
import '../styles/AdminLogin.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        'http://localhost:4242/api';

      const response = await fetch(
        `${API_URL}/admin/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to sign in.'
        );
      }

      localStorage.setItem(
        'buenisimo-admin-token',
        data.token
      );

      localStorage.setItem(
        'buenisimo-admin',
        JSON.stringify(data.admin)
      );

      window.location.href = '/admin';
    } catch (error) {
      console.error('Admin login error:', error);

      setError(
        error.message || 'Unable to sign in.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-brand">
          <img
            src={logoBuenisimo}
            alt="Buenísimo Restaurant"
          />

          <h1>
            Restaurant Management
          </h1>

          <p>
            Sign in to manage your restaurant
          </p>
        </div>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-login-field">
            <label htmlFor="admin-email">
              Email
            </label>

            <input
              id="admin-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">
              Password
            </label>

            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p
              className="admin-login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="admin-login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>

        <div className="admin-login-footer">
          Buenísimo Restaurant
        </div>

      </div>
    </main>
  );
}