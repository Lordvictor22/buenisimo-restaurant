import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import './AdminOrdersPage.css';

const typeLabels = {
  pickup: 'Pickup',
  delivery: 'Delivery',
};

const ORDER_ARCHIVE_KEY = 'buenisimo-admin-order-archive';
const ACTIVE_RETENTION_DAYS = 7;
const ARCHIVE_RETENTION_DAYS = 60;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getOrderTimestamp = (order) => {
  const rawDate = order?.created_at || order?.createdAt || order?.date || new Date().toISOString();
  const time = new Date(rawDate).getTime();
  return Number.isFinite(time) ? time : Date.now();
};

const getArchiveKey = (order) => {
  const baseId = order?.id || order?._id || `${order?.customer_email || 'guest'}-${getOrderTimestamp(order)}`;
  return `${baseId}`;
};

const normalizeArchivedOrder = (order, archivedAt = Date.now()) => ({
  ...order,
  archived_at: archivedAt,
  expires_at: archivedAt + ARCHIVE_RETENTION_DAYS * DAY_IN_MS,
});

const readArchive = () => {
  try {
    const raw = localStorage.getItem(ORDER_ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading archive:', error);
    return [];
  }
};

const writeArchive = (archive) => {
  localStorage.setItem(ORDER_ARCHIVE_KEY, JSON.stringify(archive));
};

const purgeExpiredArchive = (archive) => {
  const now = Date.now();
  return archive.filter((entry) => {
    const expiresAt = Number(entry.expires_at || entry.archived_at || 0);
    return expiresAt > now;
  });
};

const syncOrderRetention = (serverOrders) => {
  const now = Date.now();
  const activeCutoff = now - ACTIVE_RETENTION_DAYS * DAY_IN_MS;
  const archiveCutoff = now - ARCHIVE_RETENTION_DAYS * DAY_IN_MS;

  const persistedArchive = purgeExpiredArchive(readArchive());
  const archiveMap = new Map();

  persistedArchive.forEach((entry) => {
    archiveMap.set(getArchiveKey(entry), entry);
  });

  const activeOrders = [];

  serverOrders.forEach((order) => {
    const orderTimestamp = getOrderTimestamp(order);
    const archiveKey = getArchiveKey(order);

    if (orderTimestamp >= activeCutoff) {
      activeOrders.push(order);
      return;
    }

    if (orderTimestamp >= archiveCutoff) {
      archiveMap.set(archiveKey, normalizeArchivedOrder(order, now));
    }
  });

  const archivedOrders = Array.from(archiveMap.values())
    .filter((entry) => Number(entry.expires_at || 0) > Date.now())
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));

  writeArchive(archivedOrders);

  return { activeOrders, archivedOrders };
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const getOrderItems = (order) => {
  const items = order?.items || order?.products || order?.order_items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const quantity = Number(item?.quantity || item?.qty || 1);
    const unitPrice = Number(item?.unit_price || item?.price || item?.total_price || 0);
    const name = item?.name || item?.product_name || item?.title || `Item ${index + 1}`;

    return {
      name,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
  });
};

const getOrderAddress = (order) => {
  const parts = [
    order?.delivery_address,
    order?.address,
    order?.street,
    order?.city,
    order?.state,
    order?.zip_code,
    order?.postal_code,
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : 'Pickup order';
};

const getOrderNote = (order) => {
  const note = order?.notes || order?.customer_note || order?.instructions || order?.delivery_instructions;
  return note || 'No special notes';
};

const getOrderStatus = (order) => order?.status || 'Pending';

const getCustomerName = (order) => order?.customer_name || order?.customer || order?.customer_email || 'Guest';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useContext(LanguageContext);
  const isSpanish = language === 'ES';
  const pageText = isSpanish ? {
    title: 'Gestión de pedidos',
    eyebrow: 'Operaciones',
    searchPlaceholder: 'Buscar por cliente o tipo de pedido',
    active: 'Pedidos activos',
    pickup: 'Recogida',
    delivery: 'Entrega',
    archived: 'Pedidos archivados',
    archivedTag: 'Guardado hasta 2 meses',
    exportCsv: 'Exportar CSV',
    exportJson: 'Exportar JSON',
    type: 'Tipo',
    month: 'Mes',
    all: 'Todos',
    allMonths: 'Todos los meses',
    noOrders: 'No se encontraron pedidos.',
    noSearch: 'Ningún pedido coincide con tu búsqueda.',
    noPickup: 'No hay pedidos para recoger.',
    noDelivery: 'No hay pedidos para entrega.',
    noArchive: 'No hay pedidos archivados para este filtro.',
    seeMore: 'Ver más',
    showLess: 'Ver menos',
    customer: 'Cliente',
    guest: 'Pedido invitado',
    deliveryLabel: 'Entrega',
    pickupLabel: 'Recoger',
    address: 'Dirección',
    notes: 'Notas',
    noNotes: 'Sin notas especiales',
    items: 'Productos',
    itemFallback: 'Sin detalles del producto.',
    loading: 'Cargando pedidos...',
    buttonLabel: isSpanish ? 'ES' : 'EN',
    buttonText: isSpanish ? 'Español' : 'English',
    toggleLabel: isSpanish ? 'Idioma' : 'Language',
  } : {
    title: 'Orders Management',
    eyebrow: 'Operations',
    searchPlaceholder: 'Search by customer or order type',
    active: 'Active orders',
    pickup: 'Pickup',
    delivery: 'Delivery',
    archived: 'Archived Orders',
    archivedTag: 'Stored up to 2 months',
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
    type: 'Type',
    month: 'Month',
    all: 'All',
    allMonths: 'All months',
    noOrders: 'No orders found.',
    noSearch: 'No orders match your search.',
    noPickup: 'No pickup orders.',
    noDelivery: 'No delivery orders.',
    noArchive: 'No archived orders for this filter.',
    seeMore: 'See more',
    showLess: 'Show less',
    customer: 'Customer',
    guest: 'Guest order',
    deliveryLabel: 'Delivery',
    pickupLabel: 'Pickup order',
    address: 'Address',
    notes: 'Notes',
    noNotes: 'No special notes',
    items: 'Items',
    itemFallback: 'No item details available.',
    loading: 'Loading orders...',
    buttonLabel: isSpanish ? 'ES' : 'EN',
    buttonText: isSpanish ? 'Español' : 'English',
    toggleLabel: isSpanish ? 'Idioma' : 'Language',
  };
  const [orders, setOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveTypeFilter, setArchiveTypeFilter] = useState('all');
  const [archiveMonthFilter, setArchiveMonthFilter] = useState('all');
  const [visibleCounts, setVisibleCounts] = useState({ pickup: 4, delivery: 4, archive: 4 });

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

        const remoteOrders = data.orders || data || [];
        const retentionResult = syncOrderRetention(remoteOrders);

        setOrders(retentionResult.activeOrders);
        setArchivedOrders(retentionResult.archivedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Error loading orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  useEffect(() => {
    const refreshArchive = () => {
      const archive = purgeExpiredArchive(readArchive());
      writeArchive(archive);
      setArchivedOrders(archive);
    };

    const interval = setInterval(refreshArchive, 7 * DAY_IN_MS);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return orders;

    return orders.filter((order) =>
      [order.customer_name, order.customer_email, order.id, order.order_type]
        .some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
    );
  }, [orders, searchTerm]);

  const archiveMonths = useMemo(() => {
    const monthSet = new Set();
    archivedOrders.forEach((order) => {
      const timestamp = getOrderTimestamp(order);
      const date = new Date(timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(monthKey);
    });

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [archivedOrders]);

  const filteredArchivedOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return archivedOrders.filter((order) => {
      const matchesType = archiveTypeFilter === 'all' || (order.order_type || 'delivery') === archiveTypeFilter;
      const timestamp = getOrderTimestamp(order);
      const date = new Date(timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const matchesMonth = archiveMonthFilter === 'all' || monthKey === archiveMonthFilter;

      const matchesSearch = !normalizedSearch || [order.customer_name, order.customer_email, order.id, order.order_type]
        .some((value) => String(value || '').toLowerCase().includes(normalizedSearch));

      return matchesType && matchesMonth && matchesSearch;
    });
  }, [archivedOrders, archiveTypeFilter, archiveMonthFilter, searchTerm]);

  const groupedOrders = useMemo(() => {
    const groups = {
      pickup: [],
      delivery: [],
    };

    filteredOrders
      .slice()
      .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a))
      .forEach((order) => {
        const type = order.order_type === 'pickup' ? 'pickup' : 'delivery';
        groups[type].push(order);
      });

    return groups;
  }, [filteredOrders]);

  const showMore = (key) => {
    setVisibleCounts((current) => ({
      ...current,
      [key]: (current[key] || 4) + 4,
    }));
  };

  const showLess = (key, defaultValue = 4) => {
    setVisibleCounts((current) => ({
      ...current,
      [key]: defaultValue,
    }));
  };

  const overviewStats = [
    { label: pageText.active, value: filteredOrders.length, accent: 'accent' },
    { label: pageText.pickup, value: groupedOrders.pickup.length, accent: 'pickup' },
    { label: pageText.delivery, value: groupedOrders.delivery.length, accent: 'delivery' },
    { label: pageText.archived, value: archivedOrders.length, accent: 'archive' },
  ];

  const exportArchivedOrders = (format = 'csv') => {
    const rows = filteredArchivedOrders.length > 0 ? filteredArchivedOrders : archivedOrders;

    if (!rows.length) {
      return;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buenisimo-archived-orders-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = ['Order ID', 'Customer', 'Type', 'Total', 'Archived Date'];
    const csvRows = rows.map((order) => [
      order.id || order._id || '',
      order.customer_name || order.customer_email || 'Guest',
      order.order_type || 'delivery',
      Number(order.total_price || order.totalAmount || 0).toFixed(2),
      new Date(order.archived_at || Date.now()).toISOString(),
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '"\"')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buenisimo-archived-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const renderOrderCard = (order) => {
    const items = getOrderItems(order);
    const total = Number(order.total_price || order.totalAmount || items.reduce((sum, item) => sum + item.total, 0) || 0);

    return (
      <article key={order.id || order._id} className="admin-order-card">
        <div className="admin-order-card-header">
          <div>
            <div className="admin-order-card-id">#{order.id || order._id}</div>
            <div className="admin-order-card-customer">{getCustomerName(order)}</div>
          </div>

          <div className="admin-order-card-meta">
            <span className={`admin-order-type-pill admin-order-type-pill--${order.order_type === 'pickup' ? 'pickup' : 'delivery'}`}>
              {typeLabels[order.order_type === 'pickup' ? 'pickup' : 'delivery']}
            </span>
            <span className="admin-order-status-pill">{getOrderStatus(order)}</span>
          </div>
        </div>

        <div className="admin-order-card-grid">
          <div className="admin-order-card-block">
            <span className="admin-order-label">{pageText.customer}</span>
            <strong>{getCustomerName(order)}</strong>
            <small>{order.customer_email || pageText.guest}</small>
          </div>

          <div className="admin-order-card-block">
            <span className="admin-order-label">{pageText.address}</span>
            <strong>{order.order_type === 'pickup' ? pageText.pickupLabel : pageText.deliveryLabel}</strong>
            <small>{getOrderAddress(order)}</small>
          </div>

          <div className="admin-order-card-block admin-order-card-block--total">
            <span className="admin-order-label">Total</span>
            <strong>{formatCurrency(total)}</strong>
            <small>{new Date(getOrderTimestamp(order)).toLocaleString()}</small>
          </div>
        </div>

        <div className="admin-order-card-note">
          <span className="admin-order-label">{pageText.notes}</span>
          <p>{getOrderNote(order)}</p>
        </div>

        <div className="admin-order-card-items">
          <div className="admin-order-label-row">
            <span className="admin-order-label">{pageText.items}</span>
            <span>{items.length} {isSpanish ? 'producto(s)' : 'product(s)'}</span>
          </div>

          {items.length === 0 ? (
            <div className="admin-order-item empty">{pageText.itemFallback}</div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="admin-order-item">
                <span>{item.name}</span>
                <div>
                  <strong>{item.quantity}x</strong>
                  <em>{formatCurrency(item.total)}</em>
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    );
  };

  const renderOrderTable = (type) => {
    const typeOrders = groupedOrders[type] || [];
    const visibleLimit = visibleCounts[type] || 4;
    const visibleOrders = typeOrders.slice(0, visibleLimit);
    const hasMore = typeOrders.length > visibleLimit;

    return (
      <section key={type} className="admin-orders-panel">
        <div className="admin-orders-panel-header">
          <h3>{typeLabels[type] || type} {pageText.active}</h3>
          <span className="admin-orders-count-badge">{typeOrders.length}</span>
        </div>

        {typeOrders.length === 0 ? (
          <div className="admin-orders-empty-state">
            {type === 'pickup' ? pageText.noPickup : pageText.noDelivery}
          </div>
        ) : (
          <>
            <div className="admin-order-card-list">
              {visibleOrders.map(renderOrderCard)}
            </div>

            {hasMore && (
              <button type="button" className="admin-orders-see-more" onClick={() => showMore(type)}>
                {pageText.seeMore}
              </button>
            )}

            {!hasMore && visibleLimit > 4 && (
              <button type="button" className="admin-orders-see-more admin-orders-see-more--secondary" onClick={() => showLess(type, 4)}>
                {pageText.showLess}
              </button>
            )}
          </>
        )}
      </section>
    );
  };

  const renderArchivedTable = () => {
    const visibleArchive = filteredArchivedOrders.slice(0, visibleCounts.archive || 4);
    const hasMoreArchive = filteredArchivedOrders.length > (visibleCounts.archive || 4);

    return (
      <section className="admin-orders-panel admin-orders-panel--archive">
        <div className="admin-orders-panel-header admin-orders-panel-header--archive">
          <h3>{pageText.archived}</h3>
          <div className="admin-orders-archive-actions">
            <span className="admin-orders-archive-tag">{pageText.archivedTag}</span>
            <button type="button" className="admin-orders-export-button" onClick={() => exportArchivedOrders('csv')} disabled={archivedOrders.length === 0}>
              {pageText.exportCsv}
            </button>
            <button type="button" className="admin-orders-export-button" onClick={() => exportArchivedOrders('json')} disabled={archivedOrders.length === 0}>
              {pageText.exportJson}
            </button>
          </div>
        </div>

        <div className="admin-orders-filter-row">
          <label>
            <span>{pageText.type}</span>
            <select value={archiveTypeFilter} onChange={(event) => setArchiveTypeFilter(event.target.value)}>
              <option value="all">{pageText.all}</option>
              <option value="pickup">{pageText.pickup}</option>
              <option value="delivery">{pageText.delivery}</option>
            </select>
          </label>

          <label>
            <span>{pageText.month}</span>
            <select value={archiveMonthFilter} onChange={(event) => setArchiveMonthFilter(event.target.value)}>
              <option value="all">{pageText.allMonths}</option>
              {archiveMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>{monthKey}</option>
              ))}
            </select>
          </label>
        </div>

        {filteredArchivedOrders.length === 0 ? (
          <div className="admin-orders-empty-state">
            {pageText.noArchive}
          </div>
        ) : (
          <>
            <div className="admin-archive-list">
              {visibleArchive.map((order) => (
                <div key={`${order.id || order._id}-${order.archived_at}`} className="admin-archive-row">
                  <div>
                    <div className="admin-archive-id">#{order.id || order._id}</div>
                    <div className="admin-archive-customer">{getCustomerName(order)}</div>
                  </div>

                  <div className="admin-archive-detail">
                    <span>{typeLabels[order.order_type === 'pickup' ? 'pickup' : 'delivery']}</span>
                    <span>{formatCurrency(Number(order.total_price || order.totalAmount || 0))}</span>
                  </div>

                  <div className="admin-archive-detail">
                    <span>{new Date(order.archived_at || Date.now()).toLocaleDateString()}</span>
                    <span>{order.customer_email || pageText.guest}</span>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreArchive && (
              <button type="button" className="admin-orders-see-more" onClick={() => showMore('archive')}>
                {pageText.seeMore}
              </button>
            )}

            {!hasMoreArchive && (visibleCounts.archive || 4) > 4 && (
              <button type="button" className="admin-orders-see-more admin-orders-see-more--secondary" onClick={() => showLess('archive', 4)}>
                {pageText.showLess}
              </button>
            )}
          </>
        )}
      </section>
    );
  };

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="admin-orders-container">
          <div className="admin-orders-loading">{pageText.loading}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-orders-page">
        <div className="admin-orders-container">
          <div className="admin-orders-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">
        <header className="admin-orders-header">
          <div>
            <span className="admin-orders-eyebrow">{pageText.eyebrow}</span>
            <h1>{pageText.title}</h1>
          </div>

          <div className="admin-orders-header-actions">
            <button
              type="button"
              className="admin-orders-language-toggle"
              onClick={() => setLanguage(isSpanish ? 'EN' : 'ES')}
              aria-label={pageText.toggleLabel}
            >
              <span>{pageText.buttonLabel}</span>
              {pageText.buttonText}
            </button>

            <label className="admin-orders-search">
              <span className="admin-orders-search-icon">⌕</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={pageText.searchPlaceholder}
                aria-label={pageText.searchPlaceholder}
              />
            </label>
          </div>
        </header>

        <section className="admin-orders-summary">
          {overviewStats.map((stat) => (
            <div key={stat.label} className={`admin-orders-stat admin-orders-stat--${stat.accent}`}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        {orders.length === 0 ? (
          <p className="admin-orders-empty-text">{pageText.noOrders}</p>
        ) : filteredOrders.length === 0 ? (
          <p className="admin-orders-empty-text">{pageText.noSearch}</p>
        ) : (
          <div className="admin-orders-columns">
            {renderOrderTable('pickup')}
            {renderOrderTable('delivery')}
          </div>
        )}

        {renderArchivedTable()}
      </div>
    </div>
  );
}