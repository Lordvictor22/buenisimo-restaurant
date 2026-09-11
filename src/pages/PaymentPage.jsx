import { useState } from 'react';
import './PaymentPage.css';

function PaymentPage() {
  const [cartItems] = useState(() => {
    const savedCart = localStorage.getItem('buenisimo-cart');

    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [checkoutData] = useState(() => {
    const savedCheckout = localStorage.getItem('buenisimo-checkout');

    return savedCheckout ? JSON.parse(savedCheckout) : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const customer = checkoutData?.customer || {};
  const orderType = checkoutData?.orderType || 'delivery';

  const handlePlaceOrder = async () => {
    setError('');

    if (!checkoutData) {
      setError('Your checkout information is missing.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        'http://localhost:4242/api/payment/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems,
            checkoutData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to start payment.'
        );
      }

      if (!data.url) {
        throw new Error('Stripe payment URL was not returned.');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);

      setError(
        error.message ||
          'Something went wrong. Please try again.'
      );

      setIsLoading(false);
    }
  };

  return (
    <main className="payment-page">
      <div className="payment-container">

        {/* HEADER */}

        <div className="payment-header">
          <span className="payment-eyebrow">
            PAYMENT
          </span>

          <h1>Complete your order</h1>

          <p>
            Review your information before placing your order.
          </p>
        </div>

        <div className="payment-layout">

          {/* LEFT COLUMN */}

          <div className="payment-main">

            {/* CUSTOMER INFORMATION */}

            <section className="payment-card">

              <h2>Customer information</h2>

              <div className="payment-customer-info">

                <div>
                  <span>Name</span>
                  <strong>
                    {customer.name || 'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {customer.phone || 'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {customer.email || 'Not provided'}
                  </strong>
                </div>

              </div>

            </section>

            {/* ORDER TYPE */}

            <section className="payment-card">

              <h2>Order type</h2>

              <div className="payment-order-type">

                <div className="payment-type-icon">
                  {orderType === 'delivery' ? '⌂' : '●'}
                </div>

                <div>
                  <strong>
                    {orderType === 'delivery'
                      ? 'Delivery'
                      : 'Pickup'}
                  </strong>

                  {orderType === 'delivery' ? (
                    <p>
                      {customer.address || 'Address not provided'}
                      <br />
                      {customer.city || ''}
                      {customer.zipCode
                        ? `, ${customer.zipCode}`
                        : ''}
                    </p>
                  ) : (
                    <p>
                      Pick up your order at Buenisimo Restaurant.
                    </p>
                  )}
                </div>

              </div>

            </section>

            {/* PAYMENT */}

            <section className="payment-card">

              <h2>Payment method</h2>

              <div className="payment-method-placeholder">

                <div className="payment-placeholder-icon">
                  $
                </div>

                <div>
                  <h3>Secure online payment</h3>

                  <p>
                    You will be redirected to Stripe to
                    complete your payment securely.
                  </p>
                </div>

              </div>

              {error && (
                <div className="payment-error">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="place-order-button"
                onClick={handlePlaceOrder}
                disabled={isLoading}
              >
                {isLoading
                  ? 'Redirecting to payment...'
                  : 'Place order'}
              </button>

            </section>

          </div>

          {/* RIGHT COLUMN */}

          <aside className="payment-card payment-order-summary">

            <h2>Your order</h2>

            <div className="payment-items">

              {cartItems.map((item) => (
                <div
                  className="payment-item"
                  key={item.id}
                >

                  <div className="payment-item-image">

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <span>Buenisimo</span>
                    )}

                  </div>

                  <div className="payment-item-info">

                    <h3>{item.name}</h3>

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

            <div className="payment-summary">

              <div className="payment-summary-row">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>

              <div className="payment-summary-total">
                <span>Total</span>

                <strong>
                  ${totalPrice.toFixed(2)}
                </strong>
              </div>

            </div>

          </aside>

        </div>

      </div>
    </main>
  );
}

export default PaymentPage;