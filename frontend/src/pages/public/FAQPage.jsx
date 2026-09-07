import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageSquare, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import FAQAccordion from '../../components/content/FAQAccordion';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import { contentService } from '../../services/contentService';

/**
 * FitBite Frequently Asked Questions Page
 */
export const FAQPage = () => {
  const [faqData, setFaqData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await contentService.getFAQ();
        setFaqData(data.faq || []);
      } catch (err) {
        console.error('Failed to load FAQ:', err);
        setError(err.message || 'Unable to retrieve FAQ.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQ();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="faq-page-root">
      {/* Hero Section */}
      <section className="faq-hero-section">
        <div className="container">
          <div className="faq-hero-content animate-slideUp">
            <Badge variant="espresso" size="md">
              <HelpCircle size={14} /> Instant Athlete Help Center
            </Badge>
            <h1 className="faq-hero-title">
              Frequently Asked <span className="text-gradient">Questions.</span>
            </h1>
            <p className="faq-hero-desc">
              Find quick answers regarding our whey isolate protein sources, allergens, shelf life, delivery tracking, and clean formulation standards.
            </p>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <div className="container faq-body-section">
        {isLoading ? (
          <Spinner centered size="lg" label="Loading frequently asked questions..." />
        ) : error ? (
          <div className="faq-error-box">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        ) : (
          <div className="faq-layout-grid">
            <div className="faq-main-col">
              <FAQAccordion faqData={faqData} />
            </div>

            {/* Side Support Help Box */}
            <div className="faq-side-col">
              <Card glass padding="lg" className="still-questions-card">
                <div className="still-icon">
                  <MessageSquare size={24} />
                </div>
                <h3 className="still-title">Still Have Questions?</h3>
                <p className="still-desc">
                  Can't find what you're looking for? Reach out directly to our certified sports nutrition desk for personalized assistance.
                </p>
                <Link to="/support">
                  <Button variant="primary" size="md" fullWidth rightIcon={<ArrowRight size={16} />}>
                    Contact Support Team
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .faq-page-root {
          width: 100%;
        }

        .faq-hero-section {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-12) 0 var(--space-10);
          text-align: center;
          border-bottom: 1px solid var(--color-border);
        }

        .faq-hero-content {
          max-width: 780px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .faq-hero-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.15;
        }

        @media (min-width: 768px) {
          .faq-hero-title {
            font-size: var(--font-size-4xl);
          }
        }

        .faq-hero-desc {
          font-size: var(--font-size-md);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .faq-body-section {
          padding-top: var(--space-10);
          padding-bottom: var(--space-16);
        }

        .faq-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 1024px) {
          .faq-layout-grid {
            grid-template-columns: 1fr 340px;
            gap: var(--space-12);
            align-items: start;
          }
        }

        .still-questions-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          position: sticky;
          top: 100px;
        }

        .still-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .still-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .still-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-2);
        }

        .faq-error-box {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-danger);
          padding: var(--space-6);
          background: var(--color-danger-bg);
          border-radius: var(--radius-xl);
        }
      `}</style>
    </div>
  );
};

export default FAQPage;
