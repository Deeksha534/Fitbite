import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ShieldCheck, CheckCircle2, User, Star, Plus, AlertCircle } from 'lucide-react';
import RatingStars from '../common/RatingStars';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Spinner from '../common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { catalogService } from '../../services/catalogService';

/**
 * Product Customer Reviews Component with Star Breakdown, Verification Badges,
 * Eligibility Check, and Review Submission Form
 */
export const ProductReviewsSection = ({ productId }) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [reviewsData, setReviewsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  // Review modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await catalogService.getProductReviews(productId);
      setReviewsData(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError(err.message || 'Unable to load reviews.');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  const checkEligibility = useCallback(async () => {
    if (!isAuthenticated || !productId) return;
    try {
      const el = await catalogService.checkReviewEligibility(productId);
      setEligibility(el);
    } catch (err) {
      console.warn('Review eligibility check error:', err);
    }
  }, [isAuthenticated, productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setFormError('Please enter a review description.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      await catalogService.submitReview(productId, {
        rating: Number(newRating),
        title: newTitle.trim() || undefined,
        comment: newComment.trim(),
      });

      toast.success('Your review has been submitted successfully! Thank you.');
      setIsModalOpen(false);
      setNewTitle('');
      setNewComment('');
      setNewRating(5);

      // Refresh reviews & eligibility
      loadReviews();
      checkEligibility();
    } catch (err) {
      setFormError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = reviewsData?.summary || {
    total_reviews: 0,
    average_rating: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  const reviewsList = reviewsData?.reviews || [];
  const totalReviews = Number(summary.total_reviews) || 0;
  const avgRating = Number(summary.average_rating) || 0;
  const dist = summary.rating_distribution || {};

  return (
    <div className="product-reviews-root">
      {/* 1. Header & Summary Grid */}
      <div className="reviews-summary-grid">
        {/* Rating Score Card */}
        <div className="score-summary-card">
          <div className="big-rating-number">{avgRating.toFixed(1)}</div>
          <RatingStars rating={avgRating} size="lg" />
          <p className="total-reviews-caption">
            Based on {totalReviews} {totalReviews === 1 ? 'verified review' : 'verified reviews'}
          </p>
        </div>

        {/* Distribution Bars */}
        <div className="distribution-bars-card">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = dist[stars] || 0;
            const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="distribution-row">
                <span className="stars-label">{stars} ★</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="count-label">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Review Action Callout */}
        <div className="review-action-box">
          <h4 className="action-box-title">Share Your Experience</h4>
          <p className="action-box-desc">
            Help athletes make the best clean nutrition decisions.
          </p>

          {!isAuthenticated ? (
            <Link to="/login">
              <Button variant="outline" size="sm" fullWidth>
                Sign In to Review
              </Button>
            </Link>
          ) : eligibility?.has_reviewed ? (
            <Badge variant="success" size="md">
              <CheckCircle2 size={14} /> You have reviewed this product
            </Badge>
          ) : eligibility?.is_eligible_to_review ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              Write a Review
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              Write a Review
            </Button>
          )}
        </div>
      </div>

      {/* 2. Reviews List */}
      <div className="reviews-list-section">
        <h4 className="reviews-list-title">
          Customer Reviews ({totalReviews})
        </h4>

        {isLoading ? (
          <Spinner centered label="Loading customer reviews..." />
        ) : error ? (
          <div className="review-error-note">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="empty-reviews-card">
            <MessageSquare size={32} className="empty-icon" />
            <h5>No Reviews Yet</h5>
            <p>Be the first customer to review this protein bar flavor!</p>
          </div>
        ) : (
          <div className="reviews-feed">
            {reviewsList.map((rev) => (
              <div key={rev.id} className="review-item-card">
                <div className="review-item-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {rev.user_avatar ? (
                        <img src={rev.user_avatar} alt={rev.user_name} />
                      ) : (
                        <span>{rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="reviewer-name-row">
                        <span className="reviewer-name">{rev.user_name || 'Verified Athlete'}</span>
                        {rev.is_verified_purchase && (
                          <Badge variant="success" size="sm">
                            <ShieldCheck size={12} /> Verified Buyer
                          </Badge>
                        )}
                      </div>
                      <span className="review-date">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : ''}
                      </span>
                    </div>
                  </div>

                  <RatingStars rating={rev.rating} size="sm" />
                </div>

                {rev.title && <h5 className="review-title">{rev.title}</h5>}
                <p className="review-comment">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Review Submission Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Write a Customer Review"
      >
        <form onSubmit={handleSubmitReview} className="review-form">
          {formError && (
            <div className="form-alert-error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-field-group">
            <label className="field-label">Your Overall Rating</label>
            <RatingStars
              rating={newRating}
              interactive
              onChange={(r) => setNewRating(r)}
              size="lg"
            />
          </div>

          <Input
            label="Review Title (Optional)"
            placeholder="e.g., Best tasting clean protein bar!"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <Input
            label="Detailed Review"
            required
            multiline
            rows={4}
            placeholder="Tell us what you liked about the flavor, texture, digestibility, and energy boost..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />

          <div className="modal-actions-row">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSubmitting}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>

      <style>{`
        .product-reviews-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          padding: var(--space-4) 0;
        }

        .reviews-summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
          background: var(--color-bg-card);
          padding: var(--space-6);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
        }

        @media (min-width: 768px) {
          .reviews-summary-grid {
            grid-template-columns: 200px 1fr 220px;
            align-items: center;
          }
        }

        .score-summary-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-2);
        }

        .big-rating-number {
          font-family: var(--font-heading);
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1;
        }

        .total-reviews-caption {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .distribution-bars-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .distribution-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--font-size-xs);
          color: var(--color-espresso);
        }

        .stars-label {
          width: 28px;
          font-weight: var(--font-weight-semibold);
        }

        .progress-track {
          flex: 1;
          height: 8px;
          background: var(--color-cream-dark);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #f59e0b;
          border-radius: var(--radius-full);
          transition: width var(--transition-normal);
        }

        .count-label {
          width: 24px;
          text-align: right;
          color: var(--color-text-subtle);
        }

        .review-action-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .action-box-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .action-box-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-normal);
        }

        .reviews-list-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: var(--space-4);
        }

        .reviews-feed {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .review-item-card {
          padding: var(--space-5);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .review-item-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
        }

        .reviewer-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .reviewer-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
        }

        .reviewer-name-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .reviewer-name {
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
        }

        .review-date {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .review-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .review-comment {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .empty-reviews-card {
          text-align: center;
          padding: var(--space-8);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-xl);
          border: 1px dashed var(--color-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .empty-icon {
          color: var(--color-primary);
        }

        .review-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .field-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          text-transform: uppercase;
        }

        .form-alert-error {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
        }

        .modal-actions-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
          margin-top: var(--space-4);
        }
      `}</style>
    </div>
  );
};

export default ProductReviewsSection;
