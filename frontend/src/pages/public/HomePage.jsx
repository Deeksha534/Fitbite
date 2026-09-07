import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Heart,
  ShoppingBag,
  CheckCircle,
  Activity,
  MessageSquare,
  Award,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import RatingStars from '../../components/common/RatingStars';
import ProductCard from '../../components/catalog/ProductCard';
import Spinner from '../../components/common/Spinner';
import { api } from '../../services/api';
import { catalogService } from '../../services/catalogService';

/**
 * FitBite Home & Brand Showcase Landing Page
 * Connects live catalog APIs, featured products, real customer testimonials, and backend health status.
 */
export const HomePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    // 1. Fetch Backend Health Status
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

    // 2. Fetch Live Featured Products
    const fetchFeaturedProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await catalogService.getProducts({ is_featured: true, limit: 4 });
        if (data.products && data.products.length > 0) {
          setFeaturedProducts(data.products);
        } else {
          // Fallback to top 4 products
          const fallbackData = await catalogService.getProducts({ limit: 4 });
          setFeaturedProducts(fallbackData.products || []);
        }
      } catch (err) {
        console.warn('Failed to load featured products for home page:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    // 3. Fetch Real Featured Customer Testimonials
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const reviews = await catalogService.getFeaturedReviews(3);
        setFeaturedReviews(reviews || []);
      } catch (err) {
        console.warn('Failed to load featured reviews for home page:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchHealth();
    fetchFeaturedProducts();
    fetchReviews();
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

      {/* 3. Live Signature Flavors Grid (Backend Powered) */}
      <section className="section flavors-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Our Signature Flavors</span>
            <h2 className="section-title">Featured Gourmet Protein Bars</h2>
            <p className="section-desc">Hand-crafted artisan recipes made with real roasted nuts and dark cocoa.</p>
          </div>

          {loadingProducts ? (
            <Spinner centered size="lg" label="Loading featured flavors from catalog..." />
          ) : (
            <div className="grid-products">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="view-all-cta">
            <Link to="/products">
              <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} />}>
                View Full Product Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Real Customer Testimonials Section */}
      {featuredReviews.length > 0 && (
        <section className="section testimonials-section">
          <div className="container">
            <div className="section-header">
              <span className="section-subtitle">Athlete Testimonials</span>
              <h2 className="section-title">Verified Athlete Reviews</h2>
              <p className="section-desc">Real stories from athletes, runners, and fitness enthusiasts.</p>
            </div>

            <div className="testimonials-grid">
              {featuredReviews.map((rev) => (
                <Card key={rev.id} hoverable padding="lg" className="testimonial-card">
                  <div className="testimonial-header">
                    <RatingStars rating={rev.rating || 5} size="sm" />
                    {rev.is_verified_purchase && (
                      <Badge variant="success" size="sm">
                        <ShieldCheck size={12} /> Verified Buyer
                      </Badge>
                    )}
                  </div>

                  {rev.title && <h4 className="testimonial-title">"{rev.title}"</h4>}
                  <p className="testimonial-comment">{rev.comment}</p>

                  <div className="testimonial-author">
                    <div className="author-avatar">
                      {rev.user_avatar ? (
                        <img src={rev.user_avatar} alt={rev.user_name} />
                      ) : (
                        <span>{rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'A'}</span>
                      )}
                    </div>
                    <div>
                      <span className="author-name">{rev.user_name || 'Verified Athlete'}</span>
                      {rev.product_name && (
                        <span className="author-product">Reviewed {rev.product_name}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

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

        /* --- Flavors Section --- */
        .grid-products {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 640px) {
          .grid-products {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .grid-products {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .view-all-cta {
          display: flex;
          justify-content: center;
          margin-top: var(--space-10);
        }

        /* --- Testimonials Section --- */
        .testimonials-section {
          background: var(--color-cream-subtle);
          border-top: 1px solid var(--color-border);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 768px) {
          .testimonials-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .testimonial-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          height: 100%;
        }

        .testimonial-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .testimonial-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .testimonial-comment {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          flex: 1;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border-subtle);
        }

        .author-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
        }

        .author-avatar img {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .author-name {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .author-product {
          display: block;
          font-size: 0.65rem;
          color: var(--color-text-subtle);
        }
      `}</style>
    </div>
  );
};

export default HomePage;
