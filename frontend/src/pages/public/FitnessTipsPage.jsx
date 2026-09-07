import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, User, Calendar, CheckCircle2, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { contentService } from '../../services/contentService';

/**
 * FitBite Athletic Conditioning & Recovery Advice Page
 */
export const FitnessTipsPage = () => {
  const [tips, setTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeArticle, setActiveArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await contentService.getFitnessTips();
        setTips(data.tips || []);
      } catch (err) {
        console.error('Failed to load fitness tips:', err);
        setError(err.message || 'Unable to retrieve fitness advice.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTips();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = useMemo(() => {
    const set = new Set(['All']);
    tips.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tips]);

  const filteredTips = useMemo(() => {
    return tips.filter((t) => {
      return selectedCategory === 'All' || t.category === selectedCategory;
    });
  }, [tips, selectedCategory]);

  return (
    <div className="fitness-tips-page-root">
      {/* Hero Banner */}
      <section className="fitness-hero-section">
        <div className="container">
          <div className="fitness-hero-content animate-slideUp">
            <Badge variant="primary" size="md">
              <Activity size={14} /> Athletic Performance & Recovery
            </Badge>
            <h1 className="fitness-hero-title">
              Science of <span className="text-gradient">Muscle Recovery & Fueling.</span>
            </h1>
            <p className="fitness-hero-desc">
              Expert nutritional conditioning advice, pre/post workout protocols, and hydration strategies designed to accelerate your training gains.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container fitness-body-section">
        {/* Category Pills */}
        <div className="category-pills-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`fitness-cat-pill ${selectedCategory === cat ? 'cat-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tips Grid */}
        {isLoading ? (
          <Spinner centered size="lg" label="Loading athletic performance articles..." />
        ) : error ? (
          <div className="fitness-error-box">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="no-tips-box">
            <BookOpen size={36} className="no-tip-icon" />
            <p>No articles found for the selected category.</p>
          </div>
        ) : (
          <div className="fitness-tips-grid">
            {filteredTips.map((tip) => (
              <Card key={tip.id} hoverable padding="lg" className="fitness-tip-card">
                <div className="tip-header-meta">
                  {tip.category && <Badge variant="espresso" size="sm">{tip.category}</Badge>}
                  {tip.read_time_minutes && (
                    <span className="tip-read-time">
                      <Clock size={13} /> {tip.read_time_minutes} min read
                    </span>
                  )}
                </div>

                <h3 className="tip-card-title">{tip.title}</h3>
                <p className="tip-card-summary">{tip.summary}</p>

                {/* Key Takeaways */}
                {Array.isArray(tip.key_takeaways) && tip.key_takeaways.length > 0 && (
                  <div className="takeaways-box">
                    <span className="takeaway-label">Key Takeaway:</span>
                    <p className="takeaway-item">
                      <CheckCircle2 size={14} className="takeaway-icon" />
                      <span>{tip.key_takeaways[0]}</span>
                    </p>
                  </div>
                )}

                <div className="tip-card-footer">
                  <div className="author-meta">
                    <User size={14} />
                    <span>{tip.author || 'FitBite Performance Lab'}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ArrowRight size={14} />}
                    onClick={() => setActiveArticle(tip)}
                  >
                    Read Guide
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Article Reader Modal */}
      <Modal
        isOpen={Boolean(activeArticle)}
        onClose={() => setActiveArticle(null)}
        title={activeArticle?.title}
        size="lg"
      >
        {activeArticle && (
          <div className="article-modal-content">
            <div className="article-meta-row">
              <Badge variant="primary" size="sm">{activeArticle.category}</Badge>
              <span>By {activeArticle.author || 'FitBite Science Team'}</span>
              <span>•</span>
              <span>{activeArticle.read_time_minutes} min read</span>
            </div>

            <div className="article-body-text">
              <p className="lead-summary">{activeArticle.summary}</p>
              <div className="article-main-content">
                {activeArticle.content ? (
                  <p>{activeArticle.content}</p>
                ) : (
                  <p>{activeArticle.summary}</p>
                )}
              </div>
            </div>

            {Array.isArray(activeArticle.key_takeaways) && activeArticle.key_takeaways.length > 0 && (
              <div className="modal-takeaways-panel">
                <h4>Clinical Takeaways</h4>
                <ul>
                  {activeArticle.key_takeaways.map((point, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={16} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .fitness-tips-page-root {
          width: 100%;
        }

        .fitness-hero-section {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-12) 0 var(--space-10);
          text-align: center;
          border-bottom: 1px solid var(--color-border);
        }

        .fitness-hero-content {
          max-width: 780px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .fitness-hero-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.15;
        }

        @media (min-width: 768px) {
          .fitness-hero-title {
            font-size: var(--font-size-4xl);
          }
        }

        .fitness-hero-desc {
          font-size: var(--font-size-md);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .fitness-body-section {
          padding-top: var(--space-8);
          padding-bottom: var(--space-16);
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .category-pills-wrap {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-1);
          scrollbar-width: none;
        }

        .category-pills-wrap::-webkit-scrollbar {
          display: none;
        }

        .fitness-cat-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.45rem 1rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }

        .fitness-cat-pill:hover {
          background: var(--color-cream-subtle);
          border-color: var(--color-primary-light);
        }

        .fitness-cat-pill.cat-active {
          background: var(--color-espresso);
          color: var(--color-cream);
          border-color: var(--color-espresso);
        }

        .fitness-tips-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 768px) {
          .fitness-tips-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .fitness-tip-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          height: 100%;
        }

        .tip-header-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tip-read-time {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .tip-card-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          line-height: var(--line-height-snug);
        }

        .tip-card-summary {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          flex: 1;
        }

        .takeaways-box {
          background: var(--color-cream-subtle);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-primary);
        }

        .takeaway-label {
          font-size: 0.65rem;
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-dark);
          text-transform: uppercase;
        }

        .takeaway-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-espresso);
          margin-top: 2px;
        }

        .takeaway-icon {
          color: var(--color-success);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .tip-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border-subtle);
          margin-top: auto;
        }

        .author-meta {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        /* Modal Styles */
        .article-modal-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .article-meta-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .lead-summary {
          font-size: var(--font-size-base);
          color: var(--color-espresso);
          font-weight: var(--font-weight-medium);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-4);
        }

        .article-main-content {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .modal-takeaways-panel {
          padding: var(--space-5);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
        }

        .modal-takeaways-panel h4 {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: var(--space-3);
          text-transform: uppercase;
        }

        .modal-takeaways-panel ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .modal-takeaways-panel li {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
        }

        .modal-takeaways-panel li svg {
          color: var(--color-success);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .fitness-error-box {
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

export default FitnessTipsPage;
