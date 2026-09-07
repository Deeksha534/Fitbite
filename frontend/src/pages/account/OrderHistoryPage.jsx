import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import OrderCard from '../../components/orders/OrderCard';
import OrderFilterTabs from '../../components/orders/OrderFilterTabs';
import TaxInvoiceModal from '../../components/orders/TaxInvoiceModal';
import CancelOrderModal from '../../components/orders/CancelOrderModal';
import { Package, Search, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';

/**
 * OrderHistoryPage Component
 * Full customer order dashboard supporting real-time status filtering, search, pagination,
 * tax invoicing, and cancellation.
 */
export const OrderHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [counts, setCounts] = useState({});

  // Modals state
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);

  const toast = useToast();

  useEffect(() => {
    fetchOrders(currentPage, activeFilter);
  }, [currentPage, activeFilter]);

  const fetchOrders = async (page = 1, filter = 'all') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        sort: 'created_at_desc',
      };

      if (filter && filter !== 'all') {
        params.order_status = filter;
      }

      const res = await orderService.getMyOrders(params);
      const orderList = res?.orders || res?.data?.orders || [];
      const pag = res?.pagination || res?.data?.pagination || { total: orderList.length, totalPages: 1, limit: 10 };

      setOrders(orderList);
      setPagination(pag);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load order history. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    setCurrentPage(1);
    setSearchParams(filterKey === 'all' ? {} : { status: filterKey });
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const orderNum = (order.order_number || '').toLowerCase();
    const itemMatch = order.items?.some((i) =>
      (i.product_name || '').toLowerCase().includes(q)
    );
    return orderNum.includes(q) || itemMatch;
  });

  return (
    <div className="order-history-page">
      <div className="container section">
        {/* Page Header */}
        <div className="orders-header-row">
          <div>
            <h1 className="orders-page-title">My Order History</h1>
            <p className="orders-page-subtitle">
              Track active shipments, download GST tax invoices, and manage past purchases.
            </p>
          </div>

          <div className="orders-header-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(currentPage, activeFilter)}
              isLoading={loading}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </Button>
            <Link to="/products">
              <Button variant="primary" size="sm">
                <ShoppingBag size={14} />
                <span>Shop More</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="orders-controls-bar">
          <OrderFilterTabs
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={counts}
          />

          <div className="orders-search-wrapper">
            <Search size={16} className="orders-search-icon" />
            <input
              type="text"
              className="orders-search-input"
              placeholder="Search by Order # or Product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Orders List Container */}
        {loading ? (
          <div className="orders-loading-box">
            <Spinner size="lg" />
            <p>Loading your orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="orders-cards-list">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onOpenInvoice={(id) => setInvoiceOrderId(id)}
                onOpenCancel={(ord) => setCancelOrderTarget(ord)}
              />
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="orders-pagination-bar">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </Button>

                <span className="pagination-page-indicator">
                  Page {currentPage} of {pagination.totalPages} ({pagination.total} total orders)
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card glass padding="xl" className="orders-empty-card">
            <div className="empty-orders-graphic">
              <Package size={48} />
            </div>
            <h3 className="empty-orders-title">
              {searchQuery ? 'No matching orders found' : 'No orders in this category yet'}
            </h3>
            <p className="empty-orders-desc">
              {searchQuery
                ? `We couldn't find any orders matching "${searchQuery}". Check the order number and try again.`
                : 'Fuel your workout with science-backed, premium protein bars and recovery nutrition.'}
            </p>
            <div className="empty-orders-actions">
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search Filter
                </Button>
              ) : (
                <Link to="/products">
                  <Button variant="primary">
                    <span>Explore Protein Catalog</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* GST Tax Invoice Modal */}
        <TaxInvoiceModal
          isOpen={Boolean(invoiceOrderId)}
          onClose={() => setInvoiceOrderId(null)}
          orderId={invoiceOrderId}
        />

        {/* Cancel Order Modal */}
        <CancelOrderModal
          isOpen={Boolean(cancelOrderTarget)}
          onClose={() => setCancelOrderTarget(null)}
          order={cancelOrderTarget}
          onSuccess={() => fetchOrders(currentPage, activeFilter)}
        />
      </div>

      <style>{`
        .order-history-page {
          min-height: calc(100vh - 200px);
          padding-bottom: 60px;
        }

        .orders-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 28px;
        }

        .orders-page-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--color-text-primary);
          margin: 0 0 6px;
        }

        .orders-page-subtitle {
          font-size: 0.95rem;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .orders-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .orders-controls-bar {
          margin-bottom: 20px;
        }

        .orders-search-wrapper {
          position: relative;
          max-width: 440px;
          margin-bottom: 16px;
        }

        .orders-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .orders-search-input {
          width: 100%;
          padding: 10px 36px 10px 40px;
          border-radius: 9999px;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.05);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .orders-search-input:focus {
          border-color: var(--color-primary, #c87a3e);
          box-shadow: 0 0 0 3px rgba(200, 122, 62, 0.15);
        }

        .clear-search-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 1.2rem;
          cursor: pointer;
          line-height: 1;
        }

        .orders-loading-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 16px;
          color: var(--color-text-secondary);
        }

        .orders-cards-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .orders-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0;
          border-top: 1px solid var(--color-border);
          margin-top: 20px;
        }

        .pagination-page-indicator {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .orders-empty-card {
          text-align: center;
          padding: 60px 24px;
        }

        .empty-orders-graphic {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.1);
          color: var(--color-primary, #c87a3e);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .empty-orders-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 8px;
        }

        .empty-orders-desc {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          max-width: 440px;
          margin: 0 auto 24px;
          line-height: 1.5;
        }

        .empty-orders-actions {
          display: flex;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .orders-header-row {
            flex-direction: column;
          }
          .orders-page-title {
            font-size: 1.6rem;
          }
          .orders-pagination-bar {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderHistoryPage;
