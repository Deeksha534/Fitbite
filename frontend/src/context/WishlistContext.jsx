import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

const DEFAULT_WISHLIST = {
  wishlist_id: null,
  item_count: 0,
  items: [],
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(DEFAULT_WISHLIST);
  const [isLoading, setIsLoading] = useState(false);
  const [movingItemId, setMovingItemId] = useState(null);

  const { isAuthenticated } = useAuth();
  const toast = useToast();

  // 1. Fetch Wishlist from Backend
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist(DEFAULT_WISHLIST);
      window.dispatchEvent(new CustomEvent('fitbite:wishlist_changed', { detail: { count: 0 } }));
      return DEFAULT_WISHLIST;
    }

    try {
      setIsLoading(true);
      const data = await wishlistService.getWishlist();
      const validWishlist = data || DEFAULT_WISHLIST;
      setWishlist(validWishlist);
      window.dispatchEvent(
        new CustomEvent('fitbite:wishlist_changed', {
          detail: { count: validWishlist.item_count || 0 },
        })
      );
      return validWishlist;
    } catch (err) {
      console.warn('Failed to load wishlist:', err.message);
      return DEFAULT_WISHLIST;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // 2. Add to Wishlist
  const addToWishlist = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to save items to your wishlist.');
        return null;
      }

      try {
        setIsLoading(true);
        const res = await wishlistService.addItem(productId);
        const updatedWishlist = res?.wishlist || res?.data?.wishlist || res?.data || res;
        if (updatedWishlist && Array.isArray(updatedWishlist.items)) {
          setWishlist(updatedWishlist);
          window.dispatchEvent(
            new CustomEvent('fitbite:wishlist_changed', {
              detail: { count: updatedWishlist.item_count || 0 },
            })
          );
        } else {
          await fetchWishlist();
        }
        return updatedWishlist;
      } catch (err) {
        const msg = err.message || 'Failed to add item to wishlist.';
        toast.error(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, toast, fetchWishlist]
  );

  // 3. Remove Item from Wishlist
  const removeFromWishlist = useCallback(
    async (itemId) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        const updatedWishlist = await wishlistService.removeItem(itemId);
        if (updatedWishlist && Array.isArray(updatedWishlist.items)) {
          setWishlist(updatedWishlist);
          window.dispatchEvent(
            new CustomEvent('fitbite:wishlist_changed', {
              detail: { count: updatedWishlist.item_count || 0 },
            })
          );
        } else {
          await fetchWishlist();
        }
        toast.info('Item removed from wishlist.');
        return updatedWishlist;
      } catch (err) {
        const msg = err.message || 'Failed to remove item from wishlist.';
        toast.error(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, toast, fetchWishlist]
  );

  // 4. Move Item to Cart Atomically
  const moveToCart = useCallback(
    async (itemId, onCartUpdate = null) => {
      if (!isAuthenticated) return null;

      try {
        setMovingItemId(itemId);
        const result = await wishlistService.moveToCart(itemId);
        const updatedWishlist = result?.wishlist;
        const updatedCart = result?.cart;

        if (updatedWishlist) {
          setWishlist(updatedWishlist);
          window.dispatchEvent(
            new CustomEvent('fitbite:wishlist_changed', {
              detail: { count: updatedWishlist.item_count || 0 },
            })
          );
        }

        if (updatedCart) {
          window.dispatchEvent(
            new CustomEvent('fitbite:cart_changed', {
              detail: { count: updatedCart.item_count || 0 },
            })
          );
          if (onCartUpdate) onCartUpdate(updatedCart);
        }

        toast.success('Moved item to your shopping cart!');
        return result;
      } catch (err) {
        const msg = err.message || 'Failed to move item to cart.';
        toast.error(msg);
        throw err;
      } finally {
        setMovingItemId(null);
      }
    },
    [isAuthenticated, toast]
  );

  // 5. Helper: Is product in wishlist?
  const isInWishlist = useCallback(
    (productId) => {
      if (!wishlist.items || wishlist.items.length === 0) return false;
      return wishlist.items.some(
        (item) => item.product?.id === productId || item.product_id === productId
      );
    },
    [wishlist.items]
  );

  const value = {
    wishlist,
    items: wishlist.items || [],
    itemCount: wishlist.item_count || 0,
    isLoading,
    movingItemId,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    isInWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
