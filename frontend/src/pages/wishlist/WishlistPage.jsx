import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import WishlistCard from '../../components/wishlist/WishlistCard';
import EmptyWishlist from '../../components/wishlist/EmptyWishlist';
import Spinner from '../../components/common/Spinner';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

/**
 * FitBite Saved Wishlist Page
 */
export const WishlistPage = () => {
  const { items, itemCount, isLoading, movingItemId, removeFromWishlist, moveToCart } =
    useWishlist();
  const { fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleMoveToCart = async (itemId) => {
    await moveToCart(itemId, () => {
      fetchCart();
    });
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="wishlist-page-wrapper">
        <div className="container">
          <Spinner centered size="xl" label="Loading your saved flavors..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="wishlist-page-wrapper">
        <div className="container">
          <EmptyWishlist isAuthenticated={isAuthenticated} />
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page-wrapper animate-fadeIn">
      <div className="container">
        {/* Breadcrumb & Header */}
        <div className="wishlist-header-row">
          <div>
            <Link to="/products" className="back-link">
              <ArrowLeft size={16} /> Back to Catalog
            </Link>
            <h1 className="wishlist-title">
              My Saved Wishlist <span className="wishlist-count-pill">({itemCount} items)</span>
            </h1>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="wishlist-grid">
          {items.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onMoveToCart={handleMoveToCart}
              onRemove={removeFromWishlist}
              isMoving={movingItemId === item.id}
            />
          ))}
        </div>
      </div>

      <style>{`
        .wishlist-page-wrapper {
          padding: var(--space-8) 0 var(--space-16);
          min-height: 60vh;
        }

        .wishlist-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          text-decoration: none;
          margin-bottom: var(--space-2);
          transition: color var(--transition-fast);
        }

        .back-link:hover {
          color: var(--color-primary);
        }

        .wishlist-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        @media (min-width: 768px) {
          .wishlist-title {
            font-size: var(--font-size-3xl);
          }
        }

        .wishlist-count-pill {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-normal);
          color: var(--color-text-muted);
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 640px) {
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .wishlist-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .wishlist-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default WishlistPage;
