import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export const PlaceholderPage = ({ title, subtitle, phase = '4B' }) => {
  return (
    <div className="container section flex-center">
      <Card glass padding="lg" className="placeholder-card">
        <div className="placeholder-badge-wrap">
          <Badge variant="primary" size="sm">
            <Sparkles size={12} /> Phase {phase} Target
          </Badge>
        </div>

        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-desc">
          {subtitle || 'This module layout shell is configured and ready for full backend state connection in upcoming sub-phases.'}
        </p>

        <div className="placeholder-actions">
          <Link to="/">
            <Button variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />}>
              Return to Home
            </Button>
          </Link>
        </div>
      </Card>

      <style>{`
        .placeholder-card {
          max-width: 580px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: var(--space-8) auto;
        }

        .placeholder-badge-wrap {
          margin-bottom: var(--space-3);
        }

        .placeholder-title {
          font-size: var(--font-size-2xl);
          color: var(--color-espresso);
          margin-bottom: var(--space-2);
        }

        .placeholder-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-6);
        }

        .placeholder-actions {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default PlaceholderPage;
