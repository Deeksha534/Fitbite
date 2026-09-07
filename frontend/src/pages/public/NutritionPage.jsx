import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Heart, ShieldCheck, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import MacroCalculator from '../../components/content/MacroCalculator';
import { contentService } from '../../services/contentService';

/**
 * FitBite Science-Backed Nutrition Guide & Target Calculator Page
 */
export const NutritionPage = () => {
  const [guideData, setGuideData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await contentService.getNutritionGuide();
        setGuideData(data);
      } catch (err) {
        console.error('Failed to load nutrition guide:', err);
        setError(err.message || 'Unable to load nutrition guide data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuide();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const macroPrinciples = guideData?.macro_principles || [
    {
      title: 'Whey Protein Isolate Standard',
      description: 'Micro-filtered at low temperatures to retain native immunoglobulins and deliver 20g of rapid muscle-synthesizing amino acids with less than 1g lactose.',
      badge: '20g Whey Isolate',
    },
    {
      title: 'Prebiotic Gut Health Matrix',
      description: 'Enriched with 10g of natural chicory root prebiotic fiber to nurture optimal gut microbiome health and eliminate digestion crashes.',
      badge: '10g Prebiotic Fiber',
    },
    {
      title: 'Zero Added Sugar Guarantee',
      description: 'Sweetened solely with organic whole date paste and purified stevia leaf extract. Zero maltitol, zero artificial sweeteners, zero blood sugar spikes.',
      badge: '0g Added Sugar',
    },
  ];

  const qualityCommitments = guideData?.quality_commitments || [
    'Third-Party Heavy Metal & Purity Tested',
    'Certified Gluten-Free & Non-GMO Project Verified',
    'No Synthetic Food Dyes or Artificial Preservatives',
    'Manufactured in ISO-22000 & GMP Certified Facilities',
  ];

  return (
    <div className="nutrition-page-root">
      {/* Hero Banner */}
      <section className="nutrition-hero-section">
        <div className="container">
          <div className="nutrition-hero-content animate-slideUp">
            <Badge variant="primary" size="md">
              <Sparkles size={14} /> Science-Backed Athletic Nutrition
            </Badge>
            <h1 className="nutrition-hero-title">
              Engineered For Maximum <span className="text-gradient">Nutrient Bioavailability.</span>
            </h1>
            <p className="nutrition-hero-desc">
              Every FitBite protein bar is formulated using precision clinical ratios of pure whey isolate, prebiotic soluble fibers, and whole food botanicals to optimize recovery and gut integrity.
            </p>
          </div>
        </div>
      </section>

      <div className="container nutrition-body-section">
        {isLoading ? (
          <Spinner centered size="lg" label="Loading nutrition clinical guidelines..." />
        ) : error ? (
          <div className="nutrition-error-box">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* 1. Core Macro Principles Grid */}
            <section className="principles-section">
              <div className="section-heading-wrap">
                <span className="section-sub">Formulation Science</span>
                <h2 className="section-h2">The Three Pillars of Clean Recovery</h2>
              </div>

              <div className="principles-grid">
                {macroPrinciples.map((principle, idx) => (
                  <Card key={idx} hoverable padding="lg" className="principle-card">
                    <div className="principle-icon-box">
                      {idx === 0 ? <Zap size={24} /> : idx === 1 ? <Heart size={24} /> : <ShieldCheck size={24} />}
                    </div>
                    <Badge variant={idx === 0 ? 'primary' : idx === 1 ? 'warning' : 'success'} size="sm">
                      {principle.badge || 'Clean Fuel'}
                    </Badge>
                    <h3 className="principle-title">{principle.title}</h3>
                    <p className="principle-desc">{principle.description}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* 2. Interactive Target Calculator */}
            <section className="calculator-section">
              <MacroCalculator reference={guideData?.daily_macro_calculator_reference} />
            </section>

            {/* 3. Quality & Purity Commitments */}
            <section className="quality-section">
              <Card glass padding="lg" className="quality-card">
                <div className="quality-header">
                  <div className="quality-icon">
                    <Award size={28} />
                  </div>
                  <div>
                    <h3 className="quality-title">Our Clean Ingredient Standard</h3>
                    <p className="quality-subtitle">
                      We never cut corners on athlete safety, clean sourcing, or ingredient transparency.
                    </p>
                  </div>
                </div>

                <div className="quality-list-grid">
                  {qualityCommitments.map((commitment, i) => (
                    <div key={i} className="commitment-item">
                      <CheckCircle2 size={18} className="check-icon" />
                      <span>{commitment}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </>
        )}
      </div>

      <style>{`
        .nutrition-page-root {
          width: 100%;
        }

        .nutrition-hero-section {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-12) 0 var(--space-10);
          text-align: center;
          border-bottom: 1px solid var(--color-border);
        }

        .nutrition-hero-content {
          max-width: 780px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .nutrition-hero-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.15;
        }

        @media (min-width: 768px) {
          .nutrition-hero-title {
            font-size: var(--font-size-4xl);
          }
        }

        .nutrition-hero-desc {
          font-size: var(--font-size-md);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .nutrition-body-section {
          padding-top: var(--space-10);
          padding-bottom: var(--space-16);
          display: flex;
          flex-direction: column;
          gap: var(--space-12);
        }

        .section-heading-wrap {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .section-sub {
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-dark);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .section-h2 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          margin-top: var(--space-1);
        }

        .principles-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 768px) {
          .principles-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .principle-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .principle-icon-box {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-xl);
          background: var(--color-cream-subtle);
          color: var(--color-espresso);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .principle-title {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .principle-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .quality-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
        }

        .quality-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .quality-icon {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .quality-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .quality-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .quality-list-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 768px) {
          .quality-list-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .commitment-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          background: var(--color-cream-subtle);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .check-icon {
          color: var(--color-success);
          flex-shrink: 0;
        }

        .nutrition-error-box {
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

export default NutritionPage;
