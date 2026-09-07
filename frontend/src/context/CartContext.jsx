import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const DEFAULT_CART = {
  cart_id: null,
  items: [],
  item_count: 0,
  subtotal: '0.00',
  estimated_shipping_fee: '0.00',
  estimated_total: '0.00',
  free_shipping_qualified: false,
  has_out_of_stock_items: false,
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(DEFAULT_CART);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const { isAuthenticated } = useAuth();
  const toast = useToast();

  // 1. Fetch Cart from Backend
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(DEFAULT_CART);
      window.dispatchEvent(new CustomEvent('fitbite:cart_changed', { detail: { count: 0 } }));
      return DEFAULT_CART;
    }

    try {
      setIsLoading(true);
      const data = await cartService.getCart();
      const validCart = data || DEFAULT_CART;
      setCart(validCart);
      window.dispatchEvent(
        new CustomEvent('fitbite:cart_changed', { detail: { count: validCart.item_count || 0 } })
      );
      return validCart;
    } catch (err) {
      console.warn('Failed to load shopping cart:', err.message);
      return DEFAULT_CART;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Sync on authentication state changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 2. Add to Cart (Direct Backend Validation)
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to add items to your cart.');
        return null;
      }

      try {
        setIsLoading(true);
        const updatedCart = await cartService.addItem({ product_id: productId, quantity });
        if (updatedCart) {
          setCart(updatedCart);
          window.dispatchEvent(
            new CustomEvent('fitbite:cart_changed', { detail: { count: updatedCart.item_count || 0 } })
          );
        }
        return updatedCart;
      } catch (err) {
        const msg = err.message || 'Failed to add item to cart.';
        toast.error(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, toast]
  );

  // 3. Update Quantity (Authoritative Server-Driven: User action -> API -> State update)
  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      if (!isAuthenticated) return null;

      if (quantity <= 0) {
        return removeFromCart(itemId);
      }

      try {
        setUpdatingItemId(itemId);
        const updatedCart = await cartService.updateItem(itemId, quantity);
        if (updatedCart) {
          setCart(updatedCart);
          window.dispatchEvent(
            new CustomEvent('fitbite:cart_changed', { detail: { count: updatedCart.item_count || 0 } })
          );
        }
        return updatedCart;
      } catch (err) {
        const msg = err.message || 'Failed to update item quantity.';
        toast.error(msg);
        throw err;
      } finally {
        setUpdatingItemId(null);
      }
    },
    [isAuthenticated, toast]
  );

  // 4. Remove Item from Cart
  const removeFromCart = useCallback(
    async (itemId) => {
      if (!isAuthenticated) return null;

      try {
        setUpdatingItemId(itemId);
        const updatedCart = await cartService.removeItem(itemId);
        if (updatedCart) {
          setCart(updatedCart);
          window.dispatchEvent(
            new CustomEvent('fitbite:cart_changed', { detail: { count: updatedCart.item_count || 0 } })
          );
        }
        toast.info('Item removed from cart.');
        return updatedCart;
      } catch (err) {
        const msg = err.message || 'Failed to remove item from cart.';
        toast.error(msg);
        throw err;
      } finally {
        setUpdatingItemId(null);
      }
    },
    [isAuthenticated, toast]
  );

  // 5. Clear Entire Cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      setIsLoading(true);
      const clearedCart = await cartService.clearCart();
      const resCart = clearedCart || DEFAULT_CART;
      setCart(resCart);
      window.dispatchEvent(new CustomEvent('fitbite:cart_changed', { detail: { count: 0 } }));
      return resCart;
    } catch (err) {
      const msg = err.message || 'Failed to clear cart.';
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  const value = {
    cart,
    items: cart.items || [],
    itemCount: cart.item_count || 0,
    subtotal: Number(cart.subtotal || 0),
    shippingFee: Number(cart.estimated_shipping_fee || 0),
    estimatedTotal: Number(cart.estimated_total || 0),
    freeShippingQualified: cart.free_shipping_qualified || false,
    hasOutOfStockItems: cart.has_out_of_stock_items || false,
    isLoading,
    updatingItemId,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
