import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Heart, ShoppingBag, CheckCircle, Activity } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import RatingStars from '../../components/common/RatingStars';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

/**
 * FitBite Phase 4A Showcase Landing Page
 * Demonstrates layout components, design tokens, button variants, and backend API integration.
 */
export const HomePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoadingHealth(true);
        const data = await api.get('/health');
        setHealthData(data);
      } catch (err) {
        console.error('Failed to load health status:', err);
      } finally {
        setLoadingHealth(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="home-showcase-page">
      {/* 1. Hero Showcase Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content animate-slideUp">
            <div className="hero-badge-wrap">
              <span className="hero-badge">
                <Sparkles size={14} /> 100% Clean Performance Fuel
              </span>
            </div>

            <h1 className="hero-title">
              Power Your Ambition With <span className="text-gradient">Pure Protein.</span>
            </h1>

            <p className="hero-subtitle">
              Engineered with 20g of premium whey isolate & prebiotic fiber. Zero added sugar, gluten-free, and guilt-free snacking for athletes, runners, and everyday achievers.
            </p>

            <div className="hero-cta-group">
              <Link to="/products">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Explore All Flavors
                </Button>
              </Link>

              <Link to="/nutrition">
                <Button variant="secondary" size="lg">
                  Nutrition Guide
                </Button>
              </Link>
            </div>

            {/* Backend Connectivity Indicator */}
            <div className="api-health-chip">
              <Activity size={16} className={healthData ? 'status-green' : 'status-amber'} />
              <span>
                Backend REST API Status:{' '}
                <strong>
                  {loadingHealth
                    ? 'Probing server...'
                    : healthData
                    ? `Online (${healthData.environment || 'production'})`
                    : 'Offline'}
                </strong>
              </span>
            </div>
          </div>

          <div className="hero-visual animate-fadeIn">
            <div className="hero-image-card glass-panel">
              <img
                src="/images/protein-combo.jpeg"
                alt="FitBite Protein Bars Assorted Flavors"
                className="hero-main-img"
              />
              <div className="floating-stat-card glass-panel">
                <div className="stat-icon-wrap">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="stat-number">20g</p>
                  <p className="stat-label">Clean Protein / Bar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Brand Value Highlights */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Why Choose FitBite</span>
            <h2 className="section-title">Formulated For Maximum Nutrient Density</h2>
            <p className="section-desc">
              Every bar is meticulously crafted with natural whole foods, clinically verified macro ratios, and digestive prebiotics.
            </p>
          </div>

          <div className="features-grid">
            <Card glass hoverable padding="lg" className="feature-card">
              <div className="feature-icon-box">
                <Zap size={24} />
              </div>
              <h3 className="feature-heading">20g Isolate Whey</h3>
              <p className="feature-text">
                Rapidly absorbed micro-filtered whey protein isolate to accelerate muscle recovery and sustain satiety.
              </p>
              <Badge variant="primary" size="sm">High Protein</Badge>
            </Card>

            <Card glass hoverable padding="lg" className="feature-card">
              <div className="feature-icon-box">
                <ShieldCheck size={24} />
              </div>
              <h3 className="feature-heading">Zero Added Sugar</h3>
              <p className="feature-text">
                Naturally sweetened using pure dates and stevia leaf extract with no artificial aftertaste or sugar spikes.
              </p>
              <Badge variant="success" size="sm">0g Added Sugar</Badge>
            </Card>

            <Card glass hoverable padding="lg" className="feature-card">
              <div className="feature-icon-box">
                <Heart size={24} />
              </div>
              <h3 className="feature-heading">10g Prebiotic Fiber</h3>
              <p className="feature-text">
                Infused with chicory root fiber to optimize digestive gut flora and support sustained clean energy.
              </p>
              <Badge variant="warning" size="sm">Gut Friendly</Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Flavors Preview Grid */}
      <section className="section flavors-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Our Signature Flavors</span>
            <h2 className="section-title">Delicious Gourmet Flavors</h2>
            <p className="section-desc">Hand-crafted artisan recipes made with real roasted nuts and dark cocoa.</p>
          </div>

          <div className="grid-products">
            <Card hoverable padding="none" className="product-preview-card">
              <div className="product-img-wrap">
                <img src="/images/choco-almond.jpeg" alt="Chocolate Almond Crunch" />
                <Badge variant="espresso" size="sm" className="product-badge">Top Seller</Badge>
              </div>
              <div className="product-content">
                <div className="product-meta">
                  <RatingStars rating={4.9} showScore size="sm" />
                  <Badge variant="primary" size="sm">20g Protein</Badge>
                </div>
                <h4 className="product-title">Chocolate Almond Crunch</h4>
                <p className="product-price">₹150.00 <span className="mrp-price">₹180.00</span></p>
                <Button variant="primary" size="sm" fullWidth leftIcon={<ShoppingBag size={14} />}>
                  View Details
                </Button>
              </div>
            </Card>

            <Card hoverable padding="none" className="product-preview-card">
              <div className="product-img-wrap">
                <img src="/images/peanut-fudge.jpeg" alt="Peanut Butter Fudge" />
                <Badge variant="warning" size="sm" className="product-badge">Creamy</Badge>
              </div>
              <div className="product-content">
                <div className="product-meta">
                  <RatingStars rating={4.8} showScore size="sm" />
                  <Badge variant="primary" size="sm">21g Protein</Badge>
                </div>
                <h4 className="product-title">Peanut Butter Fudge</h4>
                <p className="product-price">₹150.00 <span className="mrp-price">₹180.00</span></p>
                <Button variant="primary" size="sm" fullWidth leftIcon={<ShoppingBag size={14} />}>
                  View Details
                </Button>
              </div>
            </Card>

            <Card hoverable padding="none" className="product-preview-card">
              <div className="product-img-wrap">
                <img src="/images/berry-blast.jpeg" alt="Wild Berry Antioxidant" />
                <Badge variant="danger" size="sm" className="product-badge">Antioxidant</Badge>
              </div>
              <div className="product-content">
                <div className="product-meta">
                  <RatingStars rating={4.7} showScore size="sm" />
                  <Badge variant="primary" size="sm">19g Protein</Badge>
                </div>
                <h4 className="product-title">Wild Berry Blast</h4>
                <p className="product-price">₹150.00 <span className="mrp-price">₹180.00</span></p>
                <Button variant="primary" size="sm" fullWidth leftIcon={<ShoppingBag size={14} />}>
                  View Details
                </Button>
              </div>
            </Card>

            <Card hoverable padding="none" className="product-preview-card">
              <div className="product-img-wrap">
                <img src="/images/caramel-coffee.jpeg" alt="Caramel Macchiato" />
                <Badge variant="espresso" size="sm" className="product-badge">Coffee Infused</Badge>
              </div>
              <div className="product-content">
                <div className="product-meta">
                  <RatingStars rating={4.9} showScore size="sm" />
                  <Badge variant="primary" size="sm">20g Protein</Badge>
                </div>
                <h4 className="product-title">Caramel Macchiato</h4>
                <p className="product-price">₹160.00 <span className="mrp-price">₹190.00</span></p>
                <Button variant="primary" size="sm" fullWidth leftIcon={<ShoppingBag size={14} />}>
                  View Details
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <style>{`
        .home-showcase-page {
          width: 100%;
        }

        /* --- Hero Section --- */
        .hero-section {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-12) 0 var(--space-16);
          position: relative;
          overflow: hidden;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-10);
          align-items: center;
        }

        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1.1fr 0.9fr;
            gap: var(--space-12);
          }
        }

        .hero-badge-wrap {
          margin-bottom: var(--space-4);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: 0.35rem 0.85rem;
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-primary-subtle);
        }

        .hero-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.15;
          margin-bottom: var(--space-4);
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: var(--font-size-4xl);
          }
        }

        @media (min-width: 1280px) {
          .hero-title {
            font-size: var(--font-size-5xl);
          }
        }

        .hero-subtitle {
          font-size: var(--font-size-md);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-8);
          max-width: 580px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex-wrap: wrap;
          margin-bottom: var(--space-8);
        }

        .api-health-chip {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: 0.4rem 0.85rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          box-shadow: var(--shadow-sm);
        }

        .status-green {
          color: var(--color-success);
        }

        .status-amber {
          color: var(--color-warning);
        }

        .hero-visual {
          display: flex;
          justify-content: center;
        }

        .hero-image-card {
          position: relative;
          width: 100%;
          max-width: 480px;
          border-radius: var(--radius-2xl);
          overflow: visible;
          padding: var(--space-4);
        }

        .hero-main-img {
          width: 100%;
          height: auto;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          object-fit: cover;
        }

        .floating-stat-card {
          position: absolute;
          bottom: -20px;
          left: -15px;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-xl);
          background: #ffffff;
        }

        .stat-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-number {
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1;
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          font-weight: var(--font-weight-medium);
        }

        /* --- Features Grid --- */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: var(--space-6);
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .feature-icon-box {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: var(--color-primary-light);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-heading {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .feature-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          flex: 1;
        }

        /* --- Product Previews --- */
        .product-preview-card {
          display: flex;
          flex-direction: column;
        }

        .product-img-wrap {
          position: relative;
          width: 100%;
          padding-top: 75%;
          background: var(--color-cream-subtle);
          overflow: hidden;
        }

        .product-img-wrap img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .product-preview-card:hover .product-img-wrap img {
          transform: scale(1.06);
        }

        .product-badge {
          position: absolute;
          top: var(--space-3);
          left: var(--space-3);
        }

        .product-content {
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          flex: 1;
        }

        .product-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .product-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .product-price {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-dark);
          margin-bottom: var(--space-2);
        }

        .mrp-price {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          text-decoration: line-through;
          font-weight: var(--font-weight-regular);
          margin-left: var(--space-1);
        }
      `}</style>
    </div>
  );
};

export default HomePage;
