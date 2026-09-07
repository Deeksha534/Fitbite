import React from 'react';
import { Check, ShoppingBag, MapPin, CreditCard, CheckCircle2 } from 'lucide-react';

/**
 * Visual multi-step checkout progress header
 */
export const CheckoutSteps = ({ currentStep = 2 }) => {
  const steps = [
    { id: 1, label: 'Cart Review', icon: ShoppingBag },
    { id: 2, label: 'Delivery Address', icon: MapPin },
    { id: 3, label: 'Payment & Promo', icon: CreditCard },
    { id: 4, label: 'Confirmation', icon: CheckCircle2 },
  ];

  return (
    <div className="checkout-steps-container">
      <div className="checkout-steps-track">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div
                className={`step-item ${isActive ? 'active' : ''} ${
                  isCompleted ? 'completed' : ''
                }`}
              >
                <div className="step-circle">
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                </div>
                <span className="step-label">{step.label}</span>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={`step-connector ${
                    currentStep > step.id ? 'connector-completed' : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        .checkout-steps-container {
          width: 100%;
          padding: var(--space-4) 0 var(--space-6);
        }

        .checkout-steps-track {
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 700px;
          margin: 0 auto;
          position: relative;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          z-index: 2;
          flex: 1;
        }

        .step-circle {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          background: #ffffff;
          border: 2px solid var(--color-border);
          color: var(--color-text-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .step-item.active .step-circle {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #ffffff;
          box-shadow: 0 0 0 4px var(--color-primary-light);
        }

        .step-item.completed .step-circle {
          background: #16a34a;
          border-color: #16a34a;
          color: #ffffff;
        }

        .step-label {
          font-family: var(--font-heading);
          font-size: 0.7rem;
          font-weight: var(--font-weight-medium);
          color: var(--color-text-subtle);
          text-align: center;
          white-space: nowrap;
        }

        .step-item.active .step-label {
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .step-item.completed .step-label {
          color: #16a34a;
          font-weight: var(--font-weight-semibold);
        }

        .step-connector {
          flex: 1;
          height: 2px;
          background: var(--color-border);
          margin-top: -24px;
          transition: background-color var(--transition-normal);
        }

        .connector-completed {
          background: #16a34a;
        }

        @media (max-width: 480px) {
          .step-label {
            display: none;
          }
          .step-connector {
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutSteps;
