import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Heart, Award, CheckCircle2, Phone, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

/**
 * FitBite Global 4-Column Footer Component with Newsletter Integration
 */
export const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const toast = useToast();

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSubscribing(true);
      const res = await api.post('/newsletter/subscribe', {
        email,
        source: 'homepage_footer',
      });
      toast.success(res.message || 'Subscribed successfully to FitBite updates!');
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'Unable to subscribe at this moment. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="fitbite-footer">
      {/* 1. Value Proposition Banner */}
      <div className="footer-usp-bar">
        <div className="container footer-usp-grid">
          <div className="usp-item">
            <Award className="usp-icon" />
            <div>
              <h4>20g Clean Protein</h4>
              <p>Premium whey isolate & plant blends</p>
            </div>
          </div>

          <div className="usp-item">
            <CheckCircle2 className="usp-icon" />
            <div>
              <h4>Zero Added Sugar</h4>
              <p>Naturally sweetened with dates & stevia</p>
            </div>
          </div>

          <div className="usp-item">
            <ShieldCheck className="usp-icon" />
            <div>
              <h4>FSSAI Certified</h4>
              <p>100% lab-tested batch purity</p>
            </div>
          </div>

          <div className="usp-item">
            <Heart className="usp-icon" />
            <div>
              <h4>100% Gluten Free</h4>
              <p>Gut-friendly high fiber nutrition</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 4-Column Grid */}
      <div className="container footer-main-grid">
        {/* Column 1: Brand Info */}
        <div className="footer-col brand-col">
          <div className="footer-brand-header">
            <img src="/images/logo.jpeg" alt="FitBite Logo" className="footer-logo" />
            <span className="footer-brand-title">Fit<span className="accent">Bite</span></span>
          </div>
          <p className="footer-brand-desc">
            Empowering active lifestyles with clean, high-performance protein snacks engineered for pure energy, muscle recovery, and everyday vitality.
          </p>
          <div className="footer-contact-info">
            <div className="contact-row">
              <MapPin size={15} />
              <span>Indiranagar 100 Feet Rd, Bengaluru, KA</span>
            </div>
            <div className="contact-row">
              <Phone size={15} />
              <span>+91 80 4567 8900 (Mon–Sat 9AM–7PM)</span>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Shop Links */}
        <div className="footer-col">
          <h4 className="footer-heading">Shop Nutrition</h4>
          <ul className="footer-link-list">
            <li><Link to="/products">All Protein Bars</Link></li>
            <li><Link to="/products?flavor=Chocolate+Fudge">Chocolate Fudge Crunch</Link></li>
            <li><Link to="/products?flavor=Almond+Crunch">Roasted Almond Butter</Link></li>
            <li><Link to="/products?flavor=Berry+Blast">Wild Berry Antioxidant</Link></li>
            <li><Link to="/products?flavor=Caramel+Coffee">Caramel Macchiato</Link></li>
            <li><Link to="/track">Track Live Order</Link></li>
          </ul>
        </div>

        {/* Column 3: Wellness & Science */}
        <div className="footer-col">
          <h4 className="footer-heading">Science & Guides</h4>
          <ul className="footer-link-list">
            <li><Link to="/nutrition">Protein & Macro Guide</Link></li>
            <li><Link to="/recipes">Healthy Protein Recipes</Link></li>
            <li><Link to="/fitness-tips">Workout Recovery Advice</Link></li>
            <li><Link to="/faq">Frequently Asked Questions</Link></li>
            <li><Link to="/support">Contact Support Team</Link></li>
          </ul>
        </div>

        {/* Column 4: Newsletter Card */}
        <div className="footer-col newsletter-col">
          <h4 className="footer-heading">Join the FitBite Club</h4>
          <p className="newsletter-text">
            Subscribe for science-backed nutrition insights, weekly recipes, and exclusive promo drops.
          </p>

          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <div className="newsletter-input-wrap">
              <Mail size={16} className="newsletter-icon" />
              <input
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="newsletter-input"
                disabled={isSubscribing}
                required
              />
            </div>
            <button
              type="submit"
              className="newsletter-submit-btn"
              disabled={isSubscribing}
              aria-label="Subscribe to newsletter"
            >
              <span>{isSubscribing ? 'Subscribing...' : 'Subscribe'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
          <span className="newsletter-privacy">🔒 No spam, ever. Unsubscribe anytime in 1 click.</span>
        </div>
      </div>

      {/* 3. Bottom Legal & Payment Badges */}
      <div className="footer-bottom-bar">
        <div className="container flex-between footer-bottom-content">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} FitBite Nutrition Labs Pvt. Ltd. All rights reserved.
          </p>

          <div className="payment-badges-row">
            <span className="payment-pill">UPI</span>
            <span className="payment-pill">RuPay</span>
            <span className="payment-pill">Visa</span>
            <span className="payment-pill">Mastercard</span>
            <span className="payment-pill">Cash on Delivery</span>
          </div>
        </div>
      </div>

      <style>{`
        .fitbite-footer {
          background-color: var(--color-espresso);
          color: var(--color-cream);
          margin-top: auto;
          position: relative;
          z-index: 1;
        }

        /* --- USP Bar --- */
        .footer-usp-bar {
          background-color: var(--color-espresso-dark);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: var(--space-8) 0;
        }

        .footer-usp-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: var(--space-6);
        }

        @media (min-width: 640px) {
          .footer-usp-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .footer-usp-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .usp-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .usp-icon {
          color: var(--color-primary);
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }

        .usp-item h4 {
          color: var(--color-cream);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          margin-bottom: 2px;
        }

        .usp-item p {
          color: var(--color-text-subtle);
          font-size: var(--font-size-xs);
        }

        /* --- Main 4-Col Grid --- */
        .footer-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-10);
          padding-top: var(--space-12);
          padding-bottom: var(--space-12);
        }

        @media (min-width: 640px) {
          .footer-main-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .footer-main-grid {
            grid-template-columns: 2fr 1fr 1fr 2fr;
          }
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .footer-brand-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .footer-logo {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .footer-brand-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-cream);
        }

        .footer-brand-title .accent {
          color: var(--color-primary);
        }

        .footer-brand-desc {
          color: rgba(253, 251, 247, 0.7);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
          max-width: 320px;
        }

        .footer-contact-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }

        .contact-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: rgba(253, 251, 247, 0.6);
        }

        .footer-heading {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: var(--space-2);
        }

        .footer-link-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .footer-link-list a {
          font-size: var(--font-size-sm);
          color: rgba(253, 251, 247, 0.75);
          transition: color var(--transition-fast), padding-left var(--transition-fast);
        }

        .footer-link-list a:hover {
          color: var(--color-primary);
          padding-left: 4px;
        }

        .newsletter-text {
          font-size: var(--font-size-sm);
          color: rgba(253, 251, 247, 0.75);
          line-height: var(--line-height-relaxed);
        }

        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }

        .newsletter-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .newsletter-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--color-text-subtle);
          pointer-events: none;
        }

        .newsletter-input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 2.4rem;
          font-size: var(--font-size-sm);
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .newsletter-input:focus {
          background: rgba(255, 255, 255, 0.14);
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(200, 122, 62, 0.25);
        }

        .newsletter-submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: 0.75rem var(--space-5);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
          color: #ffffff;
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .newsletter-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary-dark) 100%);
          transform: translateY(-1px);
        }

        .newsletter-privacy {
          font-size: 0.7rem;
          color: rgba(253, 251, 247, 0.5);
        }

        /* --- Bottom Bar --- */
        .footer-bottom-bar {
          background-color: var(--color-espresso-dark);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: var(--space-5) 0;
          font-size: var(--font-size-xs);
          color: rgba(253, 251, 247, 0.6);
        }

        .footer-bottom-content {
          flex-direction: column;
          gap: var(--space-3);
          text-align: center;
        }

        @media (min-width: 768px) {
          .footer-bottom-content {
            flex-direction: row;
            text-align: left;
          }
        }

        .payment-badges-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
          justify-content: center;
        }

        .payment-pill {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-sm);
          font-size: 0.65rem;
          color: rgba(253, 251, 247, 0.8);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
