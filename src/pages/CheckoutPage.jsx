import { useState, useContext } from 'react';
import './CheckoutPage.css';
import { LanguageContext } from '../context/LanguageContext';

function CheckoutPage() {
  const { t } = useContext(LanguageContext);

  const [cartItems] = useState(() => {
    const savedCart =
      localStorage.getItem('buenisimo-cart');

    try {
      return savedCart
        ? JSON.parse(savedCart)
        : [];
    } catch (error) {
      console.error(
        'Error reading cart:',
        error
      );

      return [];
    }
  });

  const [orderType, setOrderType] =
    useState('delivery');

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    notes: '',
  });

  /*
  |--------------------------------------------------------------------------
  | Totais
  |--------------------------------------------------------------------------
  */

  const totalItems = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  /*
  |--------------------------------------------------------------------------
  | Alterar dados do cliente
  |--------------------------------------------------------------------------
  */

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;

    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Continuar para pagamento
  |--------------------------------------------------------------------------
  */

  const handleContinueToPayment = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    if (!customer.name.trim()) {
      alert('Please enter your full name.');
      return;
    }

    if (!customer.phone.trim()) {
      alert('Please enter your phone number.');
      return;
    }

    if (!customer.email.trim()) {
      alert('Please enter your email.');
      return;
    }

    if (!customer.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    if (orderType === 'delivery') {
      if (!customer.address.trim()) {
        alert(
          'Please enter your delivery address.'
        );
        return;
      }

      if (!customer.city.trim()) {
        alert('Please enter your city.');
        return;
      }

      if (!customer.zipCode.trim()) {
        alert('Please enter your ZIP code.');
        return;
      }
    }

    const checkoutData = {
      orderType,
      customer,
      totalItems,
      totalPrice,
    };

    localStorage.setItem(
      'buenisimo-checkout',
      JSON.stringify(checkoutData)
    );

    window.location.href = '/payment';
  };

  /*
  |--------------------------------------------------------------------------
  | Interface
  |--------------------------------------------------------------------------
  */

  return (
    <main className="checkout-page">
      <div className="checkout-container">

        {/* ================================================================
            HEADER
            ================================================================ */}

        <div className="checkout-header">
          <span className="checkout-eyebrow">
            {t.checkout.eyebrow}
          </span>

          <h1>{t.checkout.title}</h1>
        </div>

        {/* ================================================================
            EMPTY CART
            ================================================================ */}

        {cartItems.length === 0 ? (
          <div className="checkout-card checkout-empty">
            <h2>
              {t.checkout.emptyCart}
            </h2>
          </div>
        ) : (
          <div className="checkout-layout">

            {/* ============================================================
                LEFT COLUMN
                ============================================================ */}

            <div className="checkout-main">

              {/* ==========================================================
                  ORDER OPTIONS
                  ========================================================== */}

              <section className="checkout-card">

                <h2>
                  {t.checkout.receiveTitle}
                </h2>

                <div className="checkout-methods">

                  <button
                    type="button"
                    className={`checkout-method ${
                      orderType === 'delivery'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setOrderType('delivery')
                    }
                  >
                    {t.checkout.delivery}
                  </button>

                  <button
                    type="button"
                    className={`checkout-method ${
                      orderType === 'pickup'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setOrderType('pickup')
                    }
                  >
                    {t.checkout.pickup}
                  </button>

                </div>

              </section>

              {/* ==========================================================
                  CUSTOMER INFORMATION
                  ========================================================== */}

              <section className="checkout-card">

                <h2>
                  {t.checkout.customerTitle}
                </h2>

                <div className="checkout-fields">

                  {/* FULL NAME */}

                  <div className="checkout-field full">

                    <label htmlFor="name">
                      {t.checkout.fullName}
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={customer.name}
                      onChange={
                        handleCustomerChange
                      }
                      placeholder={
                        t.checkout
                          .fullNamePlaceholder
                      }
                      required
                    />

                  </div>

                  {/* PHONE */}

                  <div className="checkout-field">

                    <label htmlFor="phone">
                      {t.checkout.phone}
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={customer.phone}
                      onChange={
                        handleCustomerChange
                      }
                      placeholder={
                        t.checkout
                          .phonePlaceholder
                      }
                    />

                  </div>

                  {/* EMAIL */}

                  <div className="checkout-field">

                    <label htmlFor="email">
                      {t.checkout.email}
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={customer.email}
                      onChange={
                        handleCustomerChange
                      }
                      placeholder={
                        t.checkout
                          .emailPlaceholder
                      }
                    />

                  </div>

                  {/* NOTES */}

                  <div className="checkout-field full">

                    <label htmlFor="notes">
                      {t.checkout.notes}
                    </label>

                    <textarea
                      id="notes"
                      name="notes"
                      value={customer.notes}
                      onChange={
                        handleCustomerChange
                      }
                      placeholder={
                        t.checkout
                          .notesPlaceholder
                      }
                      rows="4"
                    />

                  </div>

                </div>

              </section>

              {/* ==========================================================
                  DELIVERY ADDRESS
                  ========================================================== */}

              {orderType === 'delivery' && (
                <section className="checkout-card">

                  <h2>
                    {t.checkout.addressTitle}
                  </h2>

                  <div className="checkout-fields">

                    {/* ADDRESS */}

                    <div className="checkout-field full">

                      <label htmlFor="address">
                        {t.checkout.address}
                      </label>

                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={customer.address}
                        onChange={
                          handleCustomerChange
                        }
                        placeholder={
                          t.checkout
                            .addressPlaceholder
                        }
                      />

                    </div>

                    {/* CITY */}

                    <div className="checkout-field">

                      <label htmlFor="city">
                        {t.checkout.city}
                      </label>

                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={customer.city}
                        onChange={
                          handleCustomerChange
                        }
                        placeholder={
                          t.checkout
                            .cityPlaceholder
                        }
                      />

                    </div>

                    {/* ZIP */}

                    <div className="checkout-field">

                      <label htmlFor="zipCode">
                        {t.checkout.zipCode}
                      </label>

                      <input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        value={customer.zipCode}
                        onChange={
                          handleCustomerChange
                        }
                        placeholder={
                          t.checkout
                            .zipCodePlaceholder
                        }
                      />

                    </div>

                  </div>

                </section>
              )}

              {/* ==========================================================
                  PICKUP
                  ========================================================== */}

              {orderType === 'pickup' && (
                <section className="checkout-card">

                  <h2>
                    {t.checkout.pickupTitle}
                  </h2>

                  <p className="checkout-pickup-message">
                    {t.checkout.pickupMessage}
                  </p>

                </section>
              )}

            </div>

            {/* ============================================================
                RIGHT COLUMN — ORDER SUMMARY
                ============================================================ */}

            <aside className="checkout-card checkout-order-summary">

              <h2>
                {t.checkout.orderTitle}
              </h2>

              <div className="checkout-items">

                {cartItems.map((item, index) => {

                  const itemKey =
                    item.cartKey ||
                    `${item.id}-${index}`;

                  const quantity =
                    Number(
                      item.quantity || 0
                    );

                  const price =
                    Number(
                      item.price || 0
                    );

                  const itemTotal =
                    price * quantity;

                  return (
                    <div
                      className="checkout-item"
                      key={itemKey}
                    >

                      {/* IMAGE */}

                      <div className="checkout-item-image">

                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                          />
                        ) : (
                          <span>
                            Buenisimo
                          </span>
                        )}

                      </div>

                      {/* INFO */}

                      <div className="checkout-item-info">

                        <h3>
                          {item.name}
                        </h3>

                        {/* SELECTED OPTIONS */}

                        {item.selectedOptions &&
                          item.selectedOptions.length >
                            0 && (
                            <div className="checkout-item-options">

                              {item.selectedOptions.map(
                                (
                                  option,
                                  optionIndex
                                ) => (
                                  <div
                                    className="checkout-item-option"
                                    key={`${option.option_id}-${optionIndex}`}
                                  >
                                    <span>
                                      {
                                        option.group_name
                                      }
                                      :
                                    </span>

                                    <strong>
                                      {
                                        option.option_name
                                      }
                                    </strong>
                                  </div>
                                )
                              )}

                            </div>
                          )}

                        <p>
                          {quantity} × $
                          {price.toFixed(2)}
                        </p>

                      </div>

                      {/* ITEM TOTAL */}

                      <div className="checkout-item-total">
                        $
                        {itemTotal.toFixed(
                          2
                        )}
                      </div>

                    </div>
                  );
                })}

              </div>

              {/* ==========================================================
                  SUMMARY
                  ========================================================== */}

              <div className="checkout-summary">

                <div className="checkout-summary-row">

                  <span>
                    {t.checkout.items}
                  </span>

                  <span>
                    {totalItems}
                  </span>

                </div>

                <div className="checkout-summary-total">

                  <span>
                    {t.checkout.total}
                  </span>

                  <strong>
                    ${totalPrice.toFixed(2)}
                  </strong>

                </div>

                {/* CONTINUE */}

                <button
                  type="button"
                  className="checkout-payment-button"
                  onClick={
                    handleContinueToPayment
                  }
                >
                  Continue to payment
                </button>

              </div>

            </aside>

          </div>
        )}

      </div>
    </main>
  );
}

export default CheckoutPage;  