import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './OrderConfirmationPage.css';

const readStoredValue = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    localStorage.removeItem(key);
    return fallback;
  }
};

function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [checkoutData] = useState(() => {
    const savedCheckout = readStoredValue('buenisimo-checkout', null);
    return savedCheckout && typeof savedCheckout === 'object'
      ? savedCheckout
      : null;
  });
  const [cartItems] = useState(() => {
    const savedCart = readStoredValue('buenisimo-cart', []);
    return Array.isArray(savedCart) ? savedCart : [];
  });

  const sessionId = searchParams.get('session_id');

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <main className="confirmation-page">
      <div className="confirmation-container">

        <div className="confirmation-icon">
          ✓
        </div>

        <span className="confirmation-eyebrow">
          ORDER CONFIRMED
        </span>

        <h1>
          Thank you for your order!
        </h1>

        <p className="confirmation-message">
          Your payment was successful and your order has been received.
        </p>

        <div className="confirmation-card">

          <div className="confirmation-card-header">
            <div>
              <span>ORDER TYPE</span>
              <strong>
                {checkoutData?.orderType === 'pickup'
                  ? 'Pickup'
                  : 'Delivery'}
              </strong>
            </div>

            <div>
              <span>ITEMS</span>
              <strong>{totalItems}</strong>
            </div>
          </div>

          <div className="confirmation-divider"></div>

          <div className="confirmation-customer">
            <span>CUSTOMER</span>
            <strong>
              {checkoutData?.customer?.name || 'Customer'}
            </strong>

            {checkoutData?.customer?.phone && (
              <p>{checkoutData.customer.phone}</p>
            )}

            {checkoutData?.customer?.email && (
              <p>{checkoutData.customer.email}</p>
            )}
          </div>

          {checkoutData?.orderType === 'delivery' && (
            <>
              <div className="confirmation-divider"></div>

              <div className="confirmation-customer">
                <span>DELIVERY ADDRESS</span>

                <strong>
                  {checkoutData.customer.address}
                </strong>

                <p>
                  {checkoutData.customer.city}
                  {checkoutData.customer.zipCode
                    ? `, ${checkoutData.customer.zipCode}`
                    : ''}
                </p>
              </div>
            </>
          )}

          <div className="confirmation-divider"></div>

          <div className="confirmation-items">
            <span>ORDER SUMMARY</span>

            {cartItems.map((item) => (
              <div
                className="confirmation-item"
                key={item.id}
              >
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.quantity} × $
                    {Number(item.price || 0).toFixed(2)}
                  </p>
                </div>

                <strong>
                  $
                  {(
                    Number(item.price || 0) *
                    Number(item.quantity || 0)
                  ).toFixed(2)}
                </strong>
              </div>
            ))}
          </div>

          <div className="confirmation-total">
            <span>Total</span>

            <strong>
              ${totalPrice.toFixed(2)}
            </strong>
          </div>

        </div>

        {sessionId && (
          <p className="confirmation-reference">
            Payment reference: {sessionId.slice(0, 18)}...
          </p>
        )}

        <Link
          to="/menu"
          className="confirmation-button"
        >
          Continue ordering
        </Link>

      </div>
    </main>
  );
}

export default OrderConfirmationPage;