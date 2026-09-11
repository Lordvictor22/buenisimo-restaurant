import { useState, useContext, useEffect } from 'react';
import {
  FiGlobe,
  FiChevronDown,
} from 'react-icons/fi';
import { LanguageContext } from '../../context/LanguageContext';
import Cart from '../Cart/Cart';
import './Menu.css';

const API_URL = 'http://localhost:4242/api';

function Menu() {
  const { language, setLanguage, t } = useContext(LanguageContext);

  const [activeCategory, setActiveCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDish, setSelectedDish] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('buenisimo-cart');

    try {
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error reading saved cart:', error);
      return [];
    }
  });

  const languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'PT', name: 'Português', flag: '🇧🇷' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ZH', name: '中文', flag: '🇨🇳' },
    { code: 'HI', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'TE', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'UR', name: 'اردو', flag: '🇵🇰' },
  ];

  const handleLanguageChange = (selectedLanguage) => {
    setLanguage(selectedLanguage.code);
    setLanguageOpen(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Salvar carrinho
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    localStorage.setItem(
      'buenisimo-cart',
      JSON.stringify(cartItems)
    );
  }, [cartItems]);

  /*
  |--------------------------------------------------------------------------
  | Carregar produtos
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(
          `${API_URL}/products`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || 'Unable to load products.'
          );
        }

        const formattedProducts = data.products.map(
          (product) => ({
            ...product,
            id: Number(product.id),
            price: Number(product.price),
            available:
              product.available === true ||
              product.available === 'true' ||
              product.available === 1,
          })
        );

        setDishes(formattedProducts);
      } catch (error) {
        console.error(
          'Error loading products:',
          error
        );

        setError(
          t.menu.errorLoadMenu || 'Unable to load the menu. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Categorias REAIS do banco
  |--------------------------------------------------------------------------
  */

  const categories = [
    {
      key: 'all',
      label: t.menu.category1 || 'All',
    },
    {
      key: 'Entradas',
      label: t.menu.category4 || 'Entradas',
    },
    {
      key: 'Desayunos',
      label: t.menu.category2 || 'Desayunos',
    },
    {
      key: 'Almuerzos',
      label: t.menu.category3 || 'Almuerzos',
    },
    {
      key: 'Arepas, Cachapas & Patacones',
      label:
        t.menu.categoryArepas ||
        'Arepas, Cachapas & Patacones',
    },
    {
      key: 'Hamburguesas, Hot Dogs & Sandwiches',
      label:
        t.menu.categoryBurgers ||
        'Hamburguesas, Hot Dogs & Sandwiches',
    },
    {
      key: 'Acompanhamentos',
      label:
        t.menu.categoryAcompanhamentos ||
        'Acompanhamentos',
    },
    {
      key: 'Postres',
      label: t.menu.category6 || 'Postres',
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Filtrar produtos
  |--------------------------------------------------------------------------
  */

  const filteredDishes =
    activeCategory === 'all'
      ? dishes
      : dishes.filter(
          (dish) =>
            String(dish.category).trim() ===
            activeCategory
        );

  /*
  |--------------------------------------------------------------------------
  | Fechar modal
  |--------------------------------------------------------------------------
  */

  const closeOptionsModal = () => {
    setSelectedDish(null);
    setProductOptions([]);
    setSelectedOptions({});
    setOptionsError('');
  };

  /*
  |--------------------------------------------------------------------------
  | Adicionar produto simples
  |--------------------------------------------------------------------------
  */

  const addSimpleToCart = (dish) => {
    const normalizedDish = {
      ...dish,
      id: Number(dish.id),
      price: Number(dish.price),
      quantity: 1,
      selectedOptions: [],
    };

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          Number(item.id) ===
            Number(normalizedDish.id) &&
          (!item.selectedOptions ||
            item.selectedOptions.length === 0)
      );

      if (existingItem) {
        return currentItems.map((item) => {
          if (
            Number(item.id) ===
              Number(normalizedDish.id) &&
            (!item.selectedOptions ||
              item.selectedOptions.length === 0)
          ) {
            return {
              ...item,
              id: Number(item.id),
              price: Number(item.price),
              quantity:
                Number(item.quantity || 0) + 1,
            };
          }

          return item;
        });
      }

      return [
        ...currentItems,
        normalizedDish,
      ];
    });

    /*
     * Abre o carrinho depois de atualizar
     * o estado.
     */
    setCartOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Buscar opções do produto
  |--------------------------------------------------------------------------
  */

  const loadProductOptions = async (dish) => {
    try {
      setOptionsLoading(true);
      setOptionsError('');

      const response = await fetch(
        `${API_URL}/products/${Number(dish.id)}/options`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to load product options.'
        );
      }

      const options = Array.isArray(data)
        ? data
        : [];

      /*
       * Produto sem opções:
       * adiciona diretamente ao carrinho.
       */
      if (options.length === 0) {
        addSimpleToCart(dish);
        return;
      }

      /*
       * Produto possui opções:
       * abre o modal.
       */
      const initialSelections = {};

      options.forEach((group) => {
        const groupId = Number(group.id);

        initialSelections[groupId] =
          Number(group.max_selections) > 1
            ? []
            : null;
      });

      setProductOptions(options);
      setSelectedOptions(initialSelections);
      setSelectedDish(dish);
    } catch (error) {
      console.error(
        'Error loading product options:',
        error
      );

      setOptionsError(
        t.menu.optionsError || 'Unable to load the options for this product.'
      );
    } finally {
      setOptionsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Selecionar opção
  |--------------------------------------------------------------------------
  */

  const handleOptionChange = (
    group,
    option
  ) => {
    const groupId = Number(group.id);
    const optionId = Number(option.id);

    setSelectedOptions((current) => {
      const currentValue =
        current[groupId];

      /*
       * Grupo permite várias opções.
       */
      if (
        Number(group.max_selections) > 1
      ) {
        const currentArray =
          Array.isArray(currentValue)
            ? currentValue
            : [];

        const alreadySelected =
          currentArray.some(
            (id) =>
              Number(id) === optionId
          );

        if (alreadySelected) {
          return {
            ...current,
            [groupId]:
              currentArray.filter(
                (id) =>
                  Number(id) !== optionId
              ),
          };
        }

        if (
          currentArray.length >=
          Number(group.max_selections)
        ) {
          return current;
        }

        return {
          ...current,
          [groupId]: [
            ...currentArray,
            optionId,
          ],
        };
      }

      /*
       * Grupo permite apenas uma opção.
       */
      return {
        ...current,
        [groupId]: optionId,
      };
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Validar opções
  |--------------------------------------------------------------------------
  */

  const validateOptions = () => {
    for (const group of productOptions) {
      const groupId = Number(group.id);
      const selected =
        selectedOptions[groupId];

      const selectedCount =
        Array.isArray(selected)
          ? selected.length
          : selected !== null &&
            selected !== undefined
          ? 1
          : 0;

      const minSelections = Number(
        group.min_selections || 0
      );

      const maxSelections = Number(
        group.max_selections || 1
      );

      if (
        group.required &&
        selectedCount < minSelections
      ) {
        return false;
      }

      if (
        selectedCount > maxSelections
      ) {
        return false;
      }
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | Adicionar produto configurado
  |--------------------------------------------------------------------------
  */

  const addConfiguredToCart = () => {
    if (!selectedDish) {
      return;
    }

    if (!validateOptions()) {
      setOptionsError(
        t.menu.pleaseSelectOptions || 'Please select all required options.'
      );
      return;
    }

    const selectedOptionObjects = [];

    productOptions.forEach((group) => {
      const groupId = Number(group.id);
      const selected =
        selectedOptions[groupId];

      const selectedIds =
        Array.isArray(selected)
          ? selected
          : selected !== null &&
            selected !== undefined
          ? [selected]
          : [];

      selectedIds.forEach((optionId) => {
        const option =
          group.options.find(
            (item) =>
              Number(item.id) ===
              Number(optionId)
          );

        if (!option) {
          return;
        }

        selectedOptionObjects.push({
          group_id: Number(group.id),
          group_name: group.name,
          option_id: Number(option.id),
          option_name: option.name,
          price_adjustment: Number(
            option.price_adjustment || 0
          ),
        });
      });
    });

    /*
     * Calcular preço final.
     */

    const optionTotal =
      selectedOptionObjects.reduce(
        (total, option) =>
          total +
          Number(
            option.price_adjustment || 0
          ),
        0
      );

    const basePrice = Number(
      selectedDish.price
    );

    const finalPrice =
      basePrice + optionTotal;

    /*
     * Criar identificador único:
     *
     * produto + opções.
     */

    const optionKey =
      selectedOptionObjects
        .map(
          (option) =>
            `${option.group_id}:${option.option_id}`
        )
        .sort()
        .join('|');

    const cartKey =
      `${Number(selectedDish.id)}-${optionKey}`;

    const newItem = {
      ...selectedDish,
      id: Number(selectedDish.id),
      price: finalPrice,
      basePrice,
      quantity: 1,
      cartKey,
      selectedOptions:
        selectedOptionObjects,
    };

    setCartItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            item.cartKey === cartKey
        );

      if (existingItem) {
        return currentItems.map((item) =>
          item.cartKey === cartKey
            ? {
                ...item,
                quantity:
                  Number(
                    item.quantity || 0
                  ) + 1,
              }
            : item
        );
      }

      return [
        ...currentItems,
        newItem,
      ];
    });

    /*
     * Fecha modal.
     */

    closeOptionsModal();

    /*
     * Abre carrinho.
     */

    setCartOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Alterar quantidade
  |--------------------------------------------------------------------------
  */

  const updateCartQuantity = (
    identifier,
    newQuantity
  ) => {
    const numericQuantity =
      Number(newQuantity);

    if (numericQuantity <= 0) {
      setCartItems((currentItems) =>
        currentItems.filter((item) => {
          const itemIdentifier =
            item.cartKey || item.id;

          return (
            itemIdentifier !== identifier
          );
        })
      );

      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        const itemIdentifier =
          item.cartKey || item.id;

        if (
          itemIdentifier !== identifier
        ) {
          return item;
        }

        return {
          ...item,
          id: Number(item.id),
          price: Number(item.price),
          quantity: numericQuantity,
        };
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Remover produto
  |--------------------------------------------------------------------------
  */

  const removeFromCart = (identifier) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => {
        const itemIdentifier =
          item.cartKey || item.id;

        return (
          itemIdentifier !== identifier
        );
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Interface
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <section
        className="menu-section"
        id="menu"
      >
        <div className="menu-container">

          <header className="menu-top">

            <a href="/" className="menu-brand">
              <img
                src="/src/assets/images/LogoBuenisimo123.png"
                alt="Buenísimo Restaurant"
              />
            </a>

            <nav className="menu-nav">
              <a href="/">{t.nav.home}</a>
              <a href="/menu">{t.nav.menu}</a>
              <a href="#about">{t.nav.about}</a>
              <a href="#gallery">{t.nav.gallery}</a>
            </nav>

            <div className="menu-header-actions">
              <div className="menu-language-selector">
                <button
                  type="button"
                  className="menu-language-button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  aria-label="Select language"
                  aria-expanded={languageOpen}
                >
                  <FiGlobe size={15} />

                  <span>{language}</span>

                  <FiChevronDown
                    size={13}
                    className={
                      languageOpen
                        ? 'menu-language-arrow open'
                        : 'menu-language-arrow'
                    }
                  />
                </button>

                {languageOpen && (
                  <div className="menu-language-dropdown">
                    {languages.map((item) => (
                      <button
                        type="button"
                        key={item.code}
                        className={
                          language === item.code
                            ? 'menu-language-option active'
                            : 'menu-language-option'
                        }
                        onClick={() => handleLanguageChange(item)}
                      >
                        <span className="menu-language-flag">
                          {item.flag}
                        </span>

                        <span>{item.name}</span>

                        <small>{item.code}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <a href="/menu" className="menu-header-order">
                {t.nav.order}
              </a>
            </div>

          </header>

          {/* ============================================================
              HEADER
              ============================================================ */}

          <div className="menu-header">

            <span className="menu-eyebrow">
              {t.menu.eyebrow}
            </span>

            <h2>
              {t.menu.title}

              <span>
                {t.menu.titleHighlight}
              </span>
            </h2>

            <p>
              {t.menu.description}
            </p>

          </div>

          {/* ============================================================
              CATEGORIAS
              ============================================================ */}

          <div className="menu-categories">

            {categories.map(
              (category) => (
                <button
                  key={category.key}
                  type="button"
                  className={`menu-category ${
                    activeCategory ===
                    category.key
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setActiveCategory(
                      category.key
                    )
                  }
                >
                  {category.label}
                </button>
              )
            )}

          </div>

          {/* ============================================================
              LOADING
              ============================================================ */}

          {isLoading && (
            <div className="menu-status">
              {t.menu.loadingMenu || 'Loading menu...'}
            </div>
          )}

          {/* ============================================================
              ERROR
              ============================================================ */}

          {error && (
            <div className="menu-status menu-status-error">
              {error}
            </div>
          )}

          {/* ============================================================
              EMPTY CATEGORY
              ============================================================ */}

          {!isLoading &&
            !error &&
            filteredDishes.length === 0 && (
              <div className="menu-status">
                {t.menu.noProducts ||
                  'No products available in this category.'}
              </div>
            )}

          {/* ============================================================
              PRODUCTS
              ============================================================ */}

          {!isLoading &&
            !error &&
            filteredDishes.length > 0 && (
              <div className="menu-grid">

                {filteredDishes.map(
                  (dish) => (
                    <article
                      className="menu-card"
                      key={dish.id}
                    >

                      {/* IMAGE */}

                      <div className="menu-card-image">

                        {dish.image_url ? (
                          <img
                            src={
                              dish.image_url
                            }
                            alt={
                              dish.name
                            }
                          />
                        ) : (
                          <div className="menu-card-placeholder">
                            <span>
                              Buenisimo
                            </span>
                          </div>
                        )}

                      </div>

                      {/* CONTENT */}

                      <div className="menu-card-content">

                        <div className="menu-card-top">

                          <h3>
                            {dish.name}
                          </h3>

                          <span className="menu-card-price">
                            $
                            {Number(
                              dish.price
                            ).toFixed(2)}
                          </span>

                        </div>

                        {dish.description && (
                          <p>
                            {
                              dish.description
                            }
                          </p>
                        )}

                        <button
                          type="button"
                          className="menu-card-button"
                          disabled={
                            optionsLoading
                          }
                          onClick={() =>
                            loadProductOptions(
                              dish
                            )
                          }
                        >
                          {optionsLoading
                            ? t.menu.loading || 'Loading...'
                            : t.menu.addToOrder || 'Add to order'}
                        </button>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

        </div>
      </section>

      {/* ================================================================
          PRODUCT OPTIONS MODAL
          ================================================================ */}

      {selectedDish && (
        <div
          className="product-options-overlay"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeOptionsModal();
            }
          }}
        >

          <div className="product-options-modal">

            {/* CLOSE */}

            <button
              type="button"
              className="product-options-close"
              onClick={
                closeOptionsModal
              }
              aria-label={t.menu.close || 'Close'}
            >
              ×
            </button>

            {/* HEADER */}

            <div className="product-options-header">

              <h2>
                {selectedDish.name}
              </h2>

              <p>
                {t.menu.chooseOptions || 'Choose your options'}
              </p>

            </div>

            {/* OPTIONS */}

            <div className="product-options-body">

              {productOptions.map(
                (group) => {
                  const groupId =
                    Number(group.id);

                  const selected =
                    selectedOptions[
                      groupId
                    ];

                  return (
                    <div
                      className="product-option-group"
                      key={groupId}
                    >

                      {/* GROUP HEADER */}

                      <div className="product-option-group-header">

                        <div>

                          <h3>
                            {group.name}
                          </h3>

                          {group.description && (
                            <p>
                              {
                                group.description
                              }
                            </p>
                          )}

                        </div>

                        {group.required && (
                          <span className="product-option-required">
                            {t.menu.required || 'Required'}
                          </span>
                        )}

                      </div>

                      {/* OPTIONS */}

                      <div className="product-option-list">

                        {group.options.map(
                          (option) => {

                            const optionId =
                              Number(
                                option.id
                              );

                            const isSelected =
                              Array.isArray(
                                selected
                              )
                                ? selected.some(
                                    (
                                      id
                                    ) =>
                                      Number(
                                        id
                                      ) ===
                                      optionId
                                  )
                                : Number(
                                    selected
                                  ) ===
                                  optionId;

                            return (
                              <button
                                type="button"
                                key={
                                  optionId
                                }
                                className={`product-option-item ${
                                  isSelected
                                    ? 'selected'
                                    : ''
                                }`}
                                onClick={() =>
                                  handleOptionChange(
                                    group,
                                    option
                                  )
                                }
                              >

                                <span className="product-option-check">
                                  {isSelected
                                    ? '✓'
                                    : ''}
                                </span>

                                <span className="product-option-name">
                                  {
                                    option.name
                                  }
                                </span>

                                {Number(
                                  option.price_adjustment ||
                                    0
                                ) !== 0 && (
                                  <span className="product-option-price">

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

                                  </span>
                                )}

                              </button>
                            );
                          }
                        )}

                      </div>

                    </div>
                  );
                }
              )}

              {/* ERROR */}

              {optionsError && (
                <div className="product-options-error">
                  {optionsError}
                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="product-options-footer">

              <div>

                <span>
                  {t.menu.price || 'Price'}
                </span>

                <strong>
                  $
                  {(
                    Number(
                      selectedDish.price
                    ) +
                    productOptions.reduce(
                      (
                        total,
                        group
                      ) => {
                        const selected =
                          selectedOptions[
                            Number(
                              group.id
                            )
                          ];

                        const selectedIds =
                          Array.isArray(
                            selected
                          )
                            ? selected
                            : selected !==
                                null &&
                              selected !==
                                undefined
                            ? [
                                selected,
                              ]
                            : [];

                        return (
                          total +
                          selectedIds.reduce(
                            (
                              optionTotal,
                              optionId
                            ) => {
                              const option =
                                group.options.find(
                                  (
                                    item
                                  ) =>
                                    Number(
                                      item.id
                                    ) ===
                                    Number(
                                      optionId
                                    )
                                );

                              return (
                                optionTotal +
                                Number(
                                  option?.price_adjustment ||
                                    0
                                )
                              );
                            },
                            0
                          )
                        );
                      },
                      0
                    )
                  ).toFixed(2)}
                </strong>

              </div>

              <button
                type="button"
                className="product-options-add"
                onClick={
                  addConfiguredToCart
                }
              >
                {t.menu.addToOrder || 'Add to order'}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ================================================================
          CART
          ================================================================ */}

      <Cart
        isOpen={cartOpen}
        onClose={() =>
          setCartOpen(false)
        }
        items={cartItems}
        onUpdateQuantity={
          updateCartQuantity
        }
        onRemoveItem={
          removeFromCart
        }
      />
    </>
  );
}

export default Menu;