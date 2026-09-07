import React from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCheck,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

/**
 * TrackingTimeline Component
 * Renders the 5-stage fulfillment timeline for an order.
 *
 * @param {Object} props
 * @param {Array} props.timeline - Array of 5 stages [{ stage, title, description, completed, current, timestamp }]
 * @param {number} [props.currentStageIndex] - Current stage index (1 to 5)
 * @param {boolean} [props.isCancelled] - Whether the order is cancelled
 * @param {string} [props.cancellationReason] - Reason for cancellation
 * @param {string} [props.layout] - 'vertical' | 'horizontal'
 */
export const TrackingTimeline = ({
  timeline = [],
  currentStageIndex = 1,
  isCancelled = false,
  cancellationReason = '',
  layout = 'vertical',
}) => {
  // Default fallback 5-stage timeline if not populated
  const defaultStages = [
    {
      stage: 1,
      title: 'Order Placed',
      description: 'Your order has been received and logged in our system.',
      icon: Clock,
    },
    {
      stage: 2,
      title: 'Order Confirmed',
      description: 'Payment verified and approved for fulfillment.',
      icon: FileCheck2,
    },
    {
      stage: 3,
      title: 'Packed & Quality Checked',
      description: 'Protein bars packaged in climate-controlled casing.',
      icon: Package,
    },
    {
      stage: 4,
      title: 'Shipped & In Transit',
      description: 'Dispatched with our express courier partner.',
      icon: Truck,
    },
    {
      stage: 5,
      title: 'Delivered',
      description: 'Package delivered to your delivery destination.',
      icon: CheckCheck,
    },
  ];

  const stages = timeline.length > 0 ? timeline : defaultStages;

  const getStageIcon = (stageNumber, completed, current) => {
    if (completed) return <CheckCircle2 size={18} className="stage-icon completed" />;
    switch (stageNumber) {
      case 1:
        return <Clock size={18} className={`stage-icon ${current ? 'current' : 'pending'}`} />;
      case 2:
        return <FileCheck2 size={18} className={`stage-icon ${current ? 'current' : 'pending'}`} />;
      case 3:
        return <Package size={18} className={`stage-icon ${current ? 'current' : 'pending'}`} />;
      case 4:
        return <Truck size={18} className={`stage-icon ${current ? 'current' : 'pending'}`} />;
      case 5:
        return <CheckCheck size={18} className={`stage-icon ${current ? 'current' : 'pending'}`} />;
      default:
        return <Clock size={18} className="stage-icon pending" />;
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return null;
    }
  };

  if (isCancelled) {
    return (
      <div className="tracking-cancelled-card">
        <div className="cancelled-header">
          <AlertCircle size={24} className="cancelled-icon" />
          <div>
            <h4 className="cancelled-title">Order Cancelled</h4>
            <p className="cancelled-desc">
              {cancellationReason || 'This order was cancelled and inventory has been restored.'}
            </p>
          </div>
        </div>

        <style>{`
          .tracking-cancelled-card {
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: var(--radius-lg, 12px);
            padding: 20px;
            margin: 16px 0;
          }
          .cancelled-header {
            display: flex;
            align-items: flex-start;
            gap: 14px;
          }
          .cancelled-icon {
            color: #ef4444;
            flex-shrink: 0;
            margin-top: 2px;
          }
          .cancelled-title {
            font-size: 1.05rem;
            font-weight: 700;
            color: #ef4444;
            margin: 0 0 4px;
          }
          .cancelled-desc {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
            margin: 0;
            line-height: 1.5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`tracking-timeline-root layout-${layout}`}>
      <div className="timeline-stepper">
        {stages.map((stageItem, index) => {
          const stageNumber = stageItem.stage || index + 1;
          const isCompleted = stageItem.completed || stageNumber < currentStageIndex;
          const isCurrent = stageItem.current || stageNumber === currentStageIndex;
          const isLast = index === stages.length - 1;
          const formattedTime = formatTimestamp(stageItem.timestamp);

          return (
            <div
              key={stageNumber}
              className={`timeline-step ${isCompleted ? 'is-completed' : ''} ${
                isCurrent ? 'is-current' : ''
              } ${!isCompleted && !isCurrent ? 'is-upcoming' : ''}`}
            >
              {/* Step Marker & Connector */}
              <div className="step-marker-container">
                <div className="step-node">
                  {getStageIcon(stageNumber, isCompleted, isCurrent)}
                </div>
                {!isLast && <div className="step-connector-line" />}
              </div>

              {/* Step Content */}
              <div className="step-content">
                <div className="step-header">
                  <span className="step-badge">Stage {stageNumber}</span>
                  <h4 className="step-title">{stageItem.title}</h4>
                </div>

                <p className="step-description">{stageItem.description}</p>

                {formattedTime && (
                  <div className="step-timestamp">
                    <Clock size={12} />
                    <span>{formattedTime}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .tracking-timeline-root {
          width: 100%;
          padding: 8px 0;
        }

        /* Stepper Column Layout */
        .timeline-stepper {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          position: relative;
          min-height: 80px;
        }

        .timeline-step:last-child {
          min-height: auto;
        }

        /* Marker & Line */
        .step-marker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          align-self: stretch;
          width: 36px;
          flex-shrink: 0;
        }

        .step-node {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.06);
          border: 2px solid var(--color-border);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .step-connector-line {
          width: 2px;
          flex-grow: 1;
          background: var(--color-border);
          margin: 4px 0;
          transition: background 0.3s ease;
        }

        /* Completed State */
        .timeline-step.is-completed .step-node {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
        }

        .timeline-step.is-completed .step-connector-line {
          background: #10b981;
        }

        .timeline-step.is-completed .stage-icon.completed {
          color: #ffffff;
        }

        /* Current State */
        .timeline-step.is-current .step-node {
          background: var(--color-primary, #c87a3e);
          border-color: var(--color-primary, #c87a3e);
          color: #ffffff;
          box-shadow: 0 0 16px rgba(200, 122, 62, 0.5);
          animation: pulseNode 2s infinite ease-in-out;
        }

        .timeline-step.is-current .stage-icon.current {
          color: #ffffff;
        }

        /* Upcoming State */
        .timeline-step.is-upcoming .step-node {
          opacity: 0.6;
        }

        .timeline-step.is-upcoming .stage-icon.pending {
          color: var(--color-text-muted);
        }

        /* Content */
        .step-content {
          flex-grow: 1;
          padding-bottom: 24px;
        }

        .timeline-step:last-child .step-content {
          padding-bottom: 0;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .step-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.08);
          color: var(--color-text-secondary);
        }

        .timeline-step.is-completed .step-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .timeline-step.is-current .step-badge {
          background: rgba(200, 122, 62, 0.2);
          color: var(--color-primary-light, #d97706);
        }

        .step-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .step-description {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin: 4px 0 8px;
          line-height: 1.45;
        }

        .step-timestamp {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.775rem;
          color: var(--color-primary-light, #c87a3e);
          font-weight: 500;
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.08);
          padding: 3px 8px;
          border-radius: 4px;
        }

        @keyframes pulseNode {
          0% {
            box-shadow: 0 0 0 0 rgba(200, 122, 62, 0.6);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(200, 122, 62, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(200, 122, 62, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default TrackingTimeline;
