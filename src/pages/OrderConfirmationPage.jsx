import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './OrderConfirmationPage.css';

function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [checkoutData, setCheckoutData] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const savedCheckout = localStorage.getItem('buenisimo-checkout');
    const savedCart = localStorage.getItem('buenisimo-cart');

    if (savedCheckout) {
      setCheckoutData(JSON.parse(savedCheckout));
    }

    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
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
                    {item.price.toFixed(2)}
                  </p>
                </div>

                <strong>
                  $
                  {(item.price * item.quantity).toFixed(2)}
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