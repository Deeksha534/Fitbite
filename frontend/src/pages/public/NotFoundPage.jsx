import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import Button from '../../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="not-found-container container section flex-center">
      <div className="not-found-card glass-panel text-center">
        <span className="not-found-code text-gradient">404</span>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-text">
          The fitness fuel or page you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>

        <div className="not-found-actions">
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<Home size={16} />}>
              Back to Home
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="secondary" size="md" leftIcon={<Compass size={16} />}>
              Explore Catalog
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        .not-found-container {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .not-found-card {
          max-width: 520px;
          padding: var(--space-10) var(--space-8);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .not-found-code {
          font-family: var(--font-heading);
          font-size: 5rem;
          font-weight: var(--font-weight-extrabold);
          line-height: 1;
          margin-bottom: var(--space-2);
        }

        .not-found-title {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--space-3);
        }

        .not-found-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-6);
        }

        .not-found-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
