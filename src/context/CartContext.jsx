  import { createContext, useState, useEffect } from 'react';

  export const CartContext = createContext();

  export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
      const savedCart = localStorage.getItem('buenisimo-cart');
      try {
        return savedCart ? JSON.parse(savedCart) : [];
      } catch (error) {
        console.error('Error reading saved cart:', error);
        return [];
      }
    });

    const [cartOpen, setCartOpen] = useState(false);

    // Salvar no localStorage sempre que o carrinho mudar
    useEffect(() => {
      localStorage.setItem('buenisimo-cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Função para atualizar a quantidade
    const updateCartQuantity = (identifier, newQuantity) => {
      const numericQuantity = Number(newQuantity);

      if (numericQuantity <= 0) {
        setCartItems((currentItems) =>
          currentItems.filter((item) => {
            const itemIdentifier = item.cartKey || item.id;
            return itemIdentifier !== identifier;
          })
        );
        return;
      }

      setCartItems((currentItems) =>
        currentItems.map((item) => {
          const itemIdentifier = item.cartKey || item.id;
          if (itemIdentifier !== identifier) return item;
          return {
            ...item,
            id: Number(item.id),
            price: Number(item.price),
            quantity: numericQuantity,
          };
        })
      );
    };

    // Função para remover item
    const removeFromCart = (identifier) => {
      setCartItems((currentItems) =>
        currentItems.filter((item) => {
          const itemIdentifier = item.cartKey || item.id;
          return itemIdentifier !== identifier;
        })
      );
    };

    // Função para limpar o carrinho (útil após finalizar a compra)
    const clearCart = () => {
      setCartItems([]);
    };

    return (
      <CartContext.Provider
        value={{
          cartItems,
          setCartItems,
          cartOpen,
          setCartOpen,
          updateCartQuantity,
          removeFromCart,
          clearCart,
        }}
      >
        {children}
      </CartContext.Provider>
    );
  }