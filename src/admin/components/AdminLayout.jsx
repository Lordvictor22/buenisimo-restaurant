import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout() {
  let admin = {};

  try {
    admin = JSON.parse(
      localStorage.getItem('buenisimo-admin') || '{}'
    );
  } catch {
    localStorage.removeItem('buenisimo-admin');
  }

  const handleLogout = () => {
    localStorage.removeItem('buenisimo-admin-token');
    localStorage.removeItem('buenisimo-admin');

    window.location.href = '/admin/login';
  };

  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            B
          </div>

          <div>
            <strong>Buenísimo</strong>
            <span>Restaurant</span>
          </div>
        </div>

        <nav className="admin-navigation">

          <NavLink
            to="/admin"
            end
            className="admin-nav-link"
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/orders"
            className="admin-nav-link"
          >
            Orders
          </NavLink>

          <NavLink
            to="/admin/products"
            className="admin-nav-link"
          >
            Products
          </NavLink>

          <NavLink
            to="/admin/customers"
            className="admin-nav-link"
          >
            Customers
          </NavLink>

          <NavLink
            to="/admin/settings"
            className="admin-nav-link"
          >
            Settings
          </NavLink>

        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-user">
            <div className="admin-user-avatar">
              {(admin.name || 'M')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="admin-user-info">
              <strong>
                {admin.name || 'Manager'}
              </strong>

              <span>
                {admin.role || 'Manager'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      <main className="admin-main">

        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              Buenísimo Restaurant
            </span>

            <h1>Management</h1>
          </div>

          <div className="admin-topbar-status">
            <span className="admin-status-dot" />
            Restaurant Online
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>

      </main>

    </div>
  );
}