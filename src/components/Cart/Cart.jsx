import { useNavigate } from 'react-router-dom';
import './Cart.css';

function Cart({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
}) {
  const navigate = useNavigate();

  const totalItems = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const totalPrice = items.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  return (
    <>
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`cart ${
          isOpen ? 'cart-open' : ''
        }`}
      >
        {/* ============================================================
            HEADER
            ============================================================ */}

        <div className="cart-header">
          <div>
            <span className="cart-eyebrow">
              YOUR ORDER
            </span>

            <h2>Your Cart</h2>
          </div>

          <button
            type="button"
            className="cart-close"
            onClick={onClose}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {/* ============================================================
            CONTENT
            ============================================================ */}

        <div className="cart-content">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">
                🛒
              </div>

              <h3>Your cart is empty</h3>

              <p>
                Add something delicious from our
                menu to get started.
              </p>
            </div>
          ) : (
            <div className="cart-items">
              {items.map((item, index) => {
                /*
                 * Cada combinação de produto + opções
                 * possui seu próprio cartKey.
                 *
                 * Produtos antigos salvos no localStorage
                 * ainda funcionarão através do fallback.
                 */
                const itemKey =
                  item.cartKey ||
                  `${item.id}-${index}`;

                const itemIdentifier =
                  item.cartKey || item.id;

                return (
                  <div
                    className="cart-item"
                    key={itemKey}
                  >
                    {/* ==================================================
                        IMAGE
                        ================================================== */}

                    <div className="cart-item-image">
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

                    {/* ==================================================
                        INFO
                        ================================================== */}

                    <div className="cart-item-info">
                      <h3>
                        {item.name}
                      </h3>

                      {/* ==================================================
                          OPÇÕES ESCOLHIDAS
                          ================================================== */}

                      {item.selectedOptions &&
                        item.selectedOptions.length >
                          0 && (
                          <div className="cart-item-options">
                            {item.selectedOptions.map(
                              (option, optionIndex) => (
                                <div
                                  className="cart-item-option"
                                  key={`${option.option_id}-${optionIndex}`}
                                >
                                  <span>
                                    {option.group_name}
                                    :
                                  </span>

                                  <strong>
                                    {
                                      option.option_name
                                    }
                                  </strong>

                                  {Number(
                                    option.price_adjustment ||
                                      0
                                  ) !== 0 && (
                                    <small>
                                      {Number(
                                        option.price_adjustment
                                      ) > 0
                                        ? '+'
                                        : ''}
                                      $
                                      {Number(
                                        option.price_adjustment
                                      ).toFixed(
                                        2
                                      )}
                                    </small>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}

                      {/* ==================================================
                          PRICE
                          ================================================== */}

                      <span className="cart-item-price">
                        $
                        {Number(
                          item.price || 0
                        ).toFixed(2)}
                      </span>

                      {/* ==================================================
                          ACTIONS
                          ================================================== */}

                      <div className="cart-item-actions">
                        <div className="cart-quantity">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(
                                itemIdentifier,
                                Number(
                                  item.quantity
                                ) - 1
                              )
                            }
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(
                                itemIdentifier,
                                Number(
                                  item.quantity
                                ) + 1
                              )
                            }
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() =>
                            onRemoveItem(
                              itemIdentifier
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==============================================================
            FOOTER
            ============================================================== */}

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <span>
                {totalItems}{' '}
                {totalItems === 1
                  ? 'item'
                  : 'items'}
              </span>

              <strong>
                ${totalPrice.toFixed(2)}
              </strong>
            </div>

            <button
              type="button"
              className="cart-checkout-button"
              onClick={() => {
                onClose();
                navigate('/checkout');
              }}
            >
              Continue to checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default Cart;