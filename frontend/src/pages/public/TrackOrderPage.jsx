import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import TrackingTimeline from '../../components/orders/TrackingTimeline';
import TaxInvoiceModal from '../../components/orders/TaxInvoiceModal';
import {
  Search,
  Truck,
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';

/**
 * TrackOrderPage Component
 * Public and authenticated live 5-stage order shipment tracking with privacy masking.
 */
export const TrackOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams();
  const queryOrderNumber = searchParams.get('orderNumber') || routeParams.orderNumber || '';

  const [orderInput, setOrderInput] = useState(queryOrderNumber);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (queryOrderNumber) {
      setOrderInput(queryOrderNumber);
      handleTrack(queryOrderNumber);
    }
  }, [queryOrderNumber]);

  const handleTrack = async (numToTrack) => {
    const target = (numToTrack || orderInput || '').trim();
    if (!target) {
      toast.error('Please enter a valid order number (e.g., FB-20260907-XXXX)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      setSearchParams({ orderNumber: target });

      const res = await orderService.getTracking(target);
      const data = res?.tracking || res?.data?.tracking || res?.data || res;
      setTrackingData(data);
    } catch (err) {
      console.error('Tracking fetch failed:', err);
      setTrackingData(null);
      setError(
        err.response?.data?.message ||
          `No active tracking timeline found for "${target}". Please check your order confirmation email.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleTrack(orderInput);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (_) {
      return dateStr;
    }
  };

  const items = trackingData?.items_summary || [];
  const destination = trackingData?.delivery_destination || {};
  const isCancelled = trackingData?.is_cancelled;
  const progressPercent = trackingData?.progress_percentage || 0;

  return (
    <div className="track-order-page">
      <div className="container section">
        {/* Page Hero Header */}
        <div className="track-hero text-center mb-5">
          <div className="track-hero-icon-wrap">
            <Truck size={36} />
          </div>
          <h1 className="track-hero-title">Live Order & Shipment Tracking</h1>
          <p className="track-hero-subtitle">
            Enter your authentic FitBite order tracking number (e.g.,{' '}
            <code>FB-20260907-XXXX</code>) to see real-time fulfillment and express courier dispatch.
          </p>

          {/* Tracking Search Input Bar */}
          <form onSubmit={handleFormSubmit} className="track-search-form">
            <div className="track-input-group">
              <Search size={18} className="track-search-icon" />
              <input
                type="text"
                className="track-text-input"
                placeholder="Enter order number (e.g. FB-20260907-XXXX)..."
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
              />
              <Button type="submit" variant="primary" isLoading={loading}>
                <span>Track Live</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </div>

        {/* Tracking Results Area */}
        {loading ? (
          <div className="track-loading-box">
            <Spinner size="lg" />
            <p>Querying real-time shipment nodes and courier checkpoints...</p>
          </div>
        ) : error ? (
          <Card glass padding="xl" className="track-error-card animate-fadeIn">
            <AlertCircle size={44} className="text-danger mb-3" />
            <h3>Tracking Information Unavailable</h3>
            <p className="track-error-msg">{error}</p>
            <div className="track-error-help">
              <p>Tips for locating your shipment:</p>
              <ul>
                <li>Ensure the order number begins with <code>FB-</code>.</li>
                <li>Check your registered email for your order confirmation receipt.</li>
                <li>If you are an athlete member, visit your <Link to="/account/orders">Order History</Link>.</li>
              </ul>
            </div>
            <div className="mt-4">
              <Link to="/support">
                <Button variant="outline" size="sm">
                  <HelpCircle size={14} />
                  <span>Contact Athlete Support</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : trackingData ? (
          <div className="track-results-container animate-fadeIn">
            {/* Top Status Card with Progress Bar */}
            <Card glass padding="lg" className="track-overview-card mb-4">
              <div className="overview-header">
                <div>
                  <span className="overview-label">Shipment for Order</span>
                  <h2 className="overview-order-num">{trackingData.order_number}</h2>
                </div>

                <div className="overview-badges">
                  {isCancelled ? (
                    <Badge variant="danger" size="lg">Order Cancelled</Badge>
                  ) : (
                    <Badge variant="primary" size="lg">
                      Stage {trackingData.current_stage_index || 1} of 5
                    </Badge>
                  )}
                </div>
              </div>

              {!isCancelled && (
                <div className="tracking-progress-section">
                  <div className="progress-meta-row">
                    <span>Fulfillment Progress</span>
                    <strong>{progressPercent}% Completed</strong>
                  </div>
                  <div className="progress-track-bar">
                    <div
                      className="progress-fill-bar"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Estimated Delivery Banner */}
              {!isCancelled && (
                <div className="eta-banner">
                  <div className="eta-icon-wrap">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="eta-subtext">Estimated Delivery Arrival:</span>
                    <h4 className="eta-date-text">
                      {formatDate(trackingData.estimated_delivery_date)} (Express Delivery)
                    </h4>
                  </div>
                </div>
              )}
            </Card>

            {/* Grid: Stepper and Package Destination Info */}
            <div className="track-grid-layout">
              {/* Stepper Card */}
              <Card glass padding="lg" className="track-timeline-card">
                <h3 className="card-heading">5-Stage Fulfillment Timeline</h3>
                <TrackingTimeline
                  timeline={trackingData.timeline || []}
                  currentStageIndex={trackingData.current_stage_index || 1}
                  isCancelled={isCancelled}
                  cancellationReason={trackingData.cancellation_reason}
                />
              </Card>

              {/* Destination & Package Card */}
              <div className="track-side-cards">
                {/* Destination with Privacy Masking */}
                <Card glass padding="lg" className="mb-4">
                  <h3 className="card-heading">Delivery Destination</h3>
                  <div className="destination-content">
                    <div className="dest-row">
                      <User size={15} className="text-primary" />
                      <strong>{destination.recipient || 'Recipient'}</strong>
                    </div>
                    {destination.contact && (
                      <div className="dest-row">
                        <Phone size={14} />
                        <span>{destination.contact}</span>
                      </div>
                    )}
                    <div className="dest-row">
                      <MapPin size={14} />
                      <span>
                        {destination.city}, {destination.state}
                        {destination.postal_code ? ` - ${destination.postal_code}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="privacy-badge">
                    <ShieldCheck size={13} className="text-emerald" />
                    <span>Recipient privacy masked for public security.</span>
                  </div>
                </Card>

                {/* Package Items Preview */}
                {items.length > 0 && (
                  <Card glass padding="lg" className="mb-4">
                    <h3 className="card-heading">
                      Package Items ({items.length})
                    </h3>
                    <div className="package-items-list">
                      {items.map((item, idx) => (
                        <div key={idx} className="pkg-item-row">
                          <div className="pkg-item-media">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name} />
                            ) : (
                              <Package size={18} />
                            )}
                          </div>
                          <div className="pkg-item-info">
                            <h5 className="pkg-item-name">{item.product_name}</h5>
                            <span className="pkg-item-meta">
                              {item.flavor ? `${item.flavor} • ` : ''}Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card glass padding="lg">
                  <h3 className="card-heading">Need Assistance?</h3>
                  <p className="text-secondary text-sm mb-3">
                    Have questions regarding shipment dispatch, packaging, or delivery changes?
                  </p>
                  <div className="help-actions-col">
                    <Link to="/support">
                      <Button variant="outline" size="sm" className="w-full">
                        <HelpCircle size={14} />
                        <span>Open Support Ticket</span>
                      </Button>
                    </Link>
                    <Link to="/products">
                      <Button variant="ghost" size="sm" className="w-full">
                        <span>Shop More Protein</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : searched ? null : (
          /* Empty Initial State Graphic */
          <div className="track-initial-state text-center">
            <div className="initial-icon-box">
              <Package size={40} />
            </div>
            <h3>Looking for your recent FitBite order?</h3>
            <p className="text-secondary max-w-md mx-auto">
              Check your order confirmation email or sign in to your FitBite account to automatically
              view all active orders with one click.
            </p>
            <div className="mt-4">
              <Link to="/account/orders">
                <Button variant="outline">
                  <span>Go to My Orders</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .track-order-page {
          min-height: calc(100vh - 200px);
          padding-bottom: 60px;
        }

        .track-hero {
          max-width: 680px;
          margin: 0 auto;
        }

        .track-hero-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.12);
          color: var(--color-primary, #c87a3e);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
        }

        .track-hero-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--color-text-primary);
          margin: 0 0 10px;
        }

        .track-hero-subtitle {
          font-size: 0.95rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .track-hero-subtitle code {
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--color-primary-light, #c87a3e);
          font-family: monospace;
        }

        .track-search-form {
          margin: 0 auto;
        }

        .track-input-group {
          display: flex;
          align-items: center;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.06);
          border: 2px solid var(--color-border);
          border-radius: 9999px;
          padding: 6px 8px 6px 18px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .track-input-group:focus-within {
          border-color: var(--color-primary, #c87a3e);
          box-shadow: 0 8px 28px rgba(200, 122, 62, 0.25);
        }

        .track-search-icon {
          color: var(--color-text-muted);
          flex-shrink: 0;
          margin-right: 12px;
        }

        .track-text-input {
          flex-grow: 1;
          background: transparent;
          border: none;
          color: var(--color-text-primary);
          font-size: 0.95rem;
          outline: none;
        }

        .track-loading-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 16px;
          color: var(--color-text-secondary);
        }

        .track-error-card {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px;
        }

        .track-error-msg {
          color: var(--color-text-secondary);
          font-size: 0.95rem;
          margin-bottom: 20px;
        }

        .track-error-help {
          text-align: left;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.03);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md, 8px);
          padding: 16px;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
        }

        .track-error-help p {
          font-weight: 600;
          margin: 0 0 8px;
          color: var(--color-text-primary);
        }

        .track-error-help ul {
          margin: 0;
          padding-left: 20px;
          line-height: 1.6;
        }

        .track-results-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .overview-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .overview-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary);
        }

        .overview-order-num {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 4px 0 0;
        }

        .tracking-progress-section {
          margin-bottom: 20px;
        }

        .progress-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }

        .progress-track-bar {
          width: 100%;
          height: 8px;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.08);
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-fill-bar {
          height: 100%;
          background: linear-gradient(90deg, #c87a3e 0%, #10b981 100%);
          border-radius: 9999px;
          transition: width 0.6s ease;
        }

        .eta-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-md, 8px);
          padding: 14px 18px;
        }

        .eta-icon-wrap {
          color: #10b981;
          flex-shrink: 0;
        }

        .eta-subtext {
          font-size: 0.775rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .eta-date-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: #10b981;
          margin: 2px 0 0;
        }

        .track-grid-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }

        .card-heading {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 16px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 10px;
        }

        .destination-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 14px;
        }

        .dest-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .privacy-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          padding: 6px 10px;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.02);
          border-radius: 4px;
        }

        .package-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pkg-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pkg-item-media {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.05);
          border: 1px solid var(--color-border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        .pkg-item-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pkg-item-info {
          flex-grow: 1;
        }

        .pkg-item-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 2px;
        }

        .pkg-item-meta {
          font-size: 0.775rem;
          color: var(--color-text-secondary);
        }

        .help-actions-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .w-full {
          width: 100%;
        }

        .track-initial-state {
          padding: 60px 20px;
        }

        .initial-icon-box {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.1);
          color: var(--color-primary, #c87a3e);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        @media (max-width: 860px) {
          .track-grid-layout {
            grid-template-columns: 1fr;
          }
          .track-hero-title {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackOrderPage;
