import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const TEXT = {
  EN: {
    eyebrow: 'BUENÍSIMO RESTAURANT',
    dashboard: 'Dashboard',
    subtitle: "Overview of your restaurant's performance today.",
    today: 'Today',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    language: 'Language',
    english: 'English',
    spanish: 'Español',
    sales: "Today's Sales",
    salesDesc: 'Sales generated today',
    orders: 'Orders Today',
    ordersDesc: 'Orders received today',
    average: 'Average Order',
    averageDesc: 'Average value per order',
    customers: 'Customers Today',
    customersDesc: 'Customers who ordered today',
    attention: 'Orders Requiring Attention',
    attentionDesc: 'Orders that still need action',
    noAttention: 'No orders need attention right now.',
    recent: 'Recent Orders',
    recentDesc: 'Latest orders received',
    viewAll: 'View all orders',
    noOrders: 'No orders found for today',
    noOrdersDesc: 'New orders will appear here automatically when created.',
    salesSummary: "Today's Sales Summary",
    gross: 'Gross sales',
    refunds: 'Refunds',
    net: 'Net sales',
    quick: 'Quick Actions',
    manage: 'Manage',
    products: 'Manage Products',
    productsDesc: 'Update menu items, prices and availability.',
    ordersAction: 'View Orders',
    ordersDesc: 'Review and manage customer orders.',
    customersAction: 'View Customers',
    customersActionDesc: 'Review customer order history.',
    paymentPaid: 'Paid',
    status: 'Status',
    guest: 'Guest Customer',
    error: 'Unable to load dashboard.',
    retry: 'Try again',
    justNow: 'Just now',
  },
  ES: {
    eyebrow: 'BUENÍSIMO RESTAURANT',
    dashboard: 'Panel',
    subtitle: 'Resumen del rendimiento de tu restaurante hoy.',
    today: 'Hoy',
    refresh: 'Actualizar',
    refreshing: 'Actualizando...',
    language: 'Idioma',
    english: 'English',
    spanish: 'Español',
    sales: 'Ventas de hoy',
    salesDesc: 'Ventas generadas hoy',
    orders: 'Pedidos de hoy',
    ordersDesc: 'Pedidos recibidos hoy',
    average: 'Pedido promedio',
    averageDesc: 'Valor promedio por pedido',
    customers: 'Clientes de hoy',
    customersDesc: 'Clientes que realizaron pedidos hoy',
    attention: 'Pedidos que requieren atención',
    attentionDesc: 'Pedidos que todavía necesitan acción',
    noAttention: 'No hay pedidos que requieran atención.',
    recent: 'Pedidos recientes',
    recentDesc: 'Últimos pedidos recibidos',
    viewAll: 'Ver todos los pedidos',
    noOrders: 'No hay pedidos registrados hoy',
    noOrdersDesc: 'Los nuevos pedidos aparecerán aquí automáticamente.',
    salesSummary: 'Resumen de ventas de hoy',
    gross: 'Ventas brutas',
    refunds: 'Reembolsos',
    net: 'Ventas netas',
    quick: 'Acciones rápidas',
    manage: 'Administrar',
    products: 'Administrar productos',
    productsDesc: 'Actualiza productos, precios y disponibilidad.',
    ordersAction: 'Ver pedidos',
    ordersDesc: 'Revisa y administra los pedidos de clientes.',
    customersAction: 'Ver clientes',
    customersActionDesc: 'Consulta el historial de pedidos de clientes.',
    paymentPaid: 'Pagado',
    status: 'Estado',
    guest: 'Cliente invitado',
    error: 'No se pudo cargar el panel.',
    retry: 'Intentar de nuevo',
    justNow: 'Ahora',
  },
};

const getToken = () =>
  localStorage.getItem('buenisimo-admin-token') ||
  localStorage.getItem('adminToken') ||
  localStorage.getItem('token');

const getApiUrl = () =>
  import.meta.env.VITE_API_URL || 'http://localhost:4242/api';

const normalizeStatus = (status = '') => String(status).trim().toLowerCase();

function StatusBadge({ status, language }) {
  const t = TEXT[language];
  const key = normalizeStatus(status);

  const labels = {
    paid: language === 'ES' ? 'Pagado' : 'Paid',
    pending: language === 'ES' ? 'Pendiente' : 'Pending',
    preparing: language === 'ES' ? 'Preparando' : 'Preparing',
    ready: language === 'ES' ? 'Listo' : 'Ready',
    completed: language === 'ES' ? 'Completado' : 'Completed',
    complete: language === 'ES' ? 'Completado' : 'Completed',
    cancelled: language === 'ES' ? 'Cancelado' : 'Cancelled',
    canceled: language === 'ES' ? 'Cancelado' : 'Cancelled',
    refunded: language === 'ES' ? 'Reembolsado' : 'Refunded',
  };

  return (
    <span className={`admin-dashboard-status status-${key || 'default'}`}>
      <span className="admin-dashboard-status-dot" />
      {labels[key] || status || t.paymentPaid}
    </span>
  );
}

function MetricIcon({ children }) {
  return <span className="admin-dashboard-metric-icon">{children}</span>;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    () => localStorage.getItem('buenisimo-admin-language') || 'EN'
  );

  const [dashboard, setDashboard] = useState({
    todaySales: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    recentOrders: [],
    refunds: 0,
    grossSales: null,
    netSales: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const t = TEXT[language];

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem('buenisimo-admin-language', nextLanguage);
  };

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const token = getToken();

      if (!token) {
        throw new Error(
          language === 'ES'
            ? 'No se encontró el token de autenticación. Inicia sesión nuevamente.'
            : 'Authentication token not found. Please log in again.'
        );
      }

      const response = await fetch(`${getApiUrl()}/admin/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('buenisimo-admin-token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || t.error);
      }

      const incoming = data.dashboard || {};

      setDashboard((current) => ({
        ...current,
        ...incoming,
        recentOrders: Array.isArray(incoming.recentOrders)
          ? incoming.recentOrders
          : [],
      }));
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(err.message || t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language, navigate, t.error]);

  useEffect(() => {
    loadDashboard();

    // Keeps the operational dashboard reasonably up to date.
    const interval = setInterval(() => {
      loadDashboard({ silent: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const averageOrder = useMemo(() => {
    const sales = Number(dashboard.todaySales || 0);
    const orders = Number(dashboard.todayOrders || 0);
    return orders > 0 ? sales / orders : 0;
  }, [dashboard.todaySales, dashboard.todayOrders]);

  const grossSales =
    dashboard.grossSales !== null && dashboard.grossSales !== undefined
      ? Number(dashboard.grossSales || 0)
      : Number(dashboard.todaySales || 0) + Number(dashboard.refunds || 0);

  const refunds = Number(dashboard.refunds || 0);

  const netSales =
    dashboard.netSales !== null && dashboard.netSales !== undefined
      ? Number(dashboard.netSales || 0)
      : Number(dashboard.todaySales || 0);

  const recentOrders = Array.isArray(dashboard.recentOrders)
    ? dashboard.recentOrders.slice(0, 5)
    : [];

  const pendingOrders = Number(dashboard.pendingOrders || 0);

  const formatMoney = (value) =>
    `$${Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = () =>
    new Intl.DateTimeFormat(language === 'ES' ? 'es-US' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <div>
            <span className="admin-dashboard-eyebrow">{t.eyebrow}</span>
            <h2>{t.dashboard}</h2>
            <p>{t.subtitle}</p>
          </div>
        </div>

        <div className="admin-dashboard-loading-grid">
          {[1, 2, 3, 4].map((item) => (
            <div className="admin-dashboard-skeleton" key={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-eyebrow">{t.eyebrow}</span>
          <h2>{t.dashboard}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className="admin-dashboard-header-tools">
          <div className="admin-dashboard-language">
            <span className="admin-dashboard-language-icon">文</span>
            <select
              value={language}
              onChange={(event) => changeLanguage(event.target.value)}
              aria-label={t.language}
            >
              <option value="EN">{t.english}</option>
              <option value="ES">{t.spanish}</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-dashboard-refresh"
            onClick={() => loadDashboard({ silent: true })}
            disabled={refreshing}
          >
            <span className={refreshing ? 'is-spinning' : ''}>↻</span>
            {refreshing ? t.refreshing : t.refresh}
          </button>

          <div className="admin-dashboard-date">
            <span>{t.today}</span>
            <strong>{formatDate()}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => loadDashboard()}>
            {t.retry}
          </button>
        </div>
      )}

      <section className="admin-dashboard-metrics" aria-label={t.dashboard}>
        <article className="admin-dashboard-card sales">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">{t.sales}</span>
            <MetricIcon>$</MetricIcon>
          </div>
          <strong className="admin-dashboard-card-value">
            {formatMoney(dashboard.todaySales)}
          </strong>
          <span className="admin-dashboard-card-description">
            {t.salesDesc}
          </span>
        </article>

        <article className="admin-dashboard-card orders">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">{t.orders}</span>
            <MetricIcon>#</MetricIcon>
          </div>
          <strong className="admin-dashboard-card-value">
            {Number(dashboard.todayOrders || 0)}
          </strong>
          <span className="admin-dashboard-card-description">
            {t.ordersDesc}
          </span>
        </article>

        <article className="admin-dashboard-card average">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">{t.average}</span>
            <MetricIcon>↗</MetricIcon>
          </div>
          <strong className="admin-dashboard-card-value">
            {formatMoney(averageOrder)}
          </strong>
          <span className="admin-dashboard-card-description">
            {t.averageDesc}
          </span>
        </article>

        <article className="admin-dashboard-card customers">
          <div className="admin-dashboard-card-top">
            <span className="admin-dashboard-card-label">{t.customers}</span>
            <MetricIcon>U</MetricIcon>
          </div>
          <strong className="admin-dashboard-card-value">
            {Number(dashboard.totalCustomers || 0)}
          </strong>
          <span className="admin-dashboard-card-description">
            {t.customersDesc}
          </span>
        </article>
      </section>

      <div className="admin-dashboard-main-grid">
        <section className="admin-dashboard-panel admin-dashboard-orders-panel">
          <div className="admin-dashboard-panel-header">
            <div>
              <h3>{t.recent}</h3>
              <p>{t.recentDesc}</p>
            </div>

            <button
              type="button"
              className="admin-dashboard-text-button"
              onClick={() => navigate('/admin/orders')}
            >
              {t.viewAll} <span>→</span>
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="admin-dashboard-empty">
              <div className="admin-dashboard-empty-icon">#</div>
              <strong>{t.noOrders}</strong>
              <p>{t.noOrdersDesc}</p>
            </div>
          ) : (
            <div className="admin-dashboard-orders-list">
              {recentOrders.map((order) => {
                const customer =
                  order.customer_name ||
                  order.customerName ||
                  order.customer ||
                  t.guest;

                const total =
                  order.total_price ??
                  order.total ??
                  order.amount ??
                  0;

                return (
                  <button
                    type="button"
                    className="admin-dashboard-order-row"
                    key={order.id}
                    onClick={() => navigate('/admin/orders')}
                  >
                    <div className="admin-dashboard-order-id">
                      #{order.id}
                    </div>

                    <div className="admin-dashboard-order-info">
                      <strong>{customer}</strong>
                      <span>
                        {order.total_items
                          ? `${order.total_items} ${
                              order.total_items === 1 ? 'item' : 'items'
                            }`
                          : order.order_type || t.justNow}
                      </span>
                    </div>

                    <div className="admin-dashboard-order-total">
                      <strong>{formatMoney(total)}</strong>
                      <StatusBadge
                        status={order.status}
                        language={language}
                      />
                    </div>

                    <span className="admin-dashboard-order-arrow">→</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-dashboard-panel admin-dashboard-summary-panel">
          <div className="admin-dashboard-panel-header">
            <div>
              <h3>{t.salesSummary}</h3>
              <p>{t.today}</p>
            </div>
            <MetricIcon>$</MetricIcon>
          </div>

          <div className="admin-dashboard-summary-list">
            <div>
              <span>{t.gross}</span>
              <strong>{formatMoney(grossSales)}</strong>
            </div>

            <div>
              <span>{t.refunds}</span>
              <strong className={refunds > 0 ? 'is-negative' : ''}>
                {refunds > 0 ? '-' : ''}
                {formatMoney(refunds)}
              </strong>
            </div>

            <div className="is-total">
              <span>{t.net}</span>
              <strong>{formatMoney(netSales)}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="admin-dashboard-bottom-grid">
        <section className="admin-dashboard-panel admin-dashboard-attention-panel">
          <div className="admin-dashboard-panel-header">
            <div>
              <h3>{t.attention}</h3>
              <p>{t.attentionDesc}</p>
            </div>
            <span
              className={`admin-dashboard-attention-count ${
                pendingOrders > 0 ? 'has-attention' : ''
              }`}
            >
              {pendingOrders}
            </span>
          </div>

          {pendingOrders > 0 ? (
            <button
              type="button"
              className="admin-dashboard-attention-action"
              onClick={() => navigate('/admin/orders')}
            >
              <span className="admin-dashboard-attention-icon">!</span>
              <span>
                <strong>
                  {pendingOrders}{' '}
                  {language === 'ES'
                    ? pendingOrders === 1
                      ? 'pedido necesita'
                      : 'pedidos necesitan'
                    : pendingOrders === 1
                    ? 'order needs'
                    : 'orders need'}{' '}
                  attention
                </strong>
                <small>
                  {language === 'ES'
                    ? 'Revisa los pedidos pendientes.'
                    : 'Review the orders that still need action.'}
                </small>
              </span>
              <span>→</span>
            </button>
          ) : (
            <div className="admin-dashboard-no-attention">
              <span>✓</span>
              <p>{t.noAttention}</p>
            </div>
          )}
        </section>

        <section className="admin-dashboard-panel admin-dashboard-quick-panel">
          <div className="admin-dashboard-panel-header">
            <div>
              <h3>{t.quick}</h3>
              <p>{t.manage}</p>
            </div>
          </div>

          <div className="admin-dashboard-actions">
            <button
              type="button"
              className="admin-dashboard-action"
              onClick={() => navigate('/admin/products')}
            >
              <span>
                <strong>{t.products}</strong>
                <small>{t.productsDesc}</small>
              </span>
              <span>→</span>
            </button>

            <button
              type="button"
              className="admin-dashboard-action"
              onClick={() => navigate('/admin/orders')}
            >
              <span>
                <strong>{t.ordersAction}</strong>
                <small>{t.ordersDesc}</small>
              </span>
              <span>→</span>
            </button>

            <button
              type="button"
              className="admin-dashboard-action"
              onClick={() => navigate('/admin/customers')}
            >
              <span>
                <strong>{t.customersAction}</strong>
                <small>{t.customersActionDesc}</small>
              </span>
              <span>→</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
