import React, { useState } from 'react';
import { Clock, Users, ChefHat, Check, Sparkles, BookOpen } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

/**
 * Reusable Recipe Card with Interactive Step Modal
 */
export const RecipeCard = ({ recipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(recipe?.image_url || '/images/protein-combo.jpeg');

  if (!recipe) return null;

  const totalTime = (Number(recipe.prep_time_minutes) || 0) + (Number(recipe.cook_time_minutes) || 0);

  return (
    <>
      <Card hoverable padding="none" className="recipe-card-root">
        <div className="recipe-media">
          <img
            src={imgSrc}
            alt={recipe.title}
            className="recipe-image"
            onError={() => setImgSrc('/images/protein-combo.jpeg')}
            loading="lazy"
          />
          <div className="recipe-badge-stack">
            {recipe.difficulty && (
              <Badge variant="espresso" size="sm">
                {recipe.difficulty}
              </Badge>
            )}
            {recipe.category && (
              <Badge variant="primary" size="sm">
                {recipe.category}
              </Badge>
            )}
          </div>
        </div>

        <div className="recipe-body">
          <div className="recipe-time-row">
            <span className="recipe-metric">
              <Clock size={14} /> {totalTime || 15} mins
            </span>
            {recipe.servings && (
              <span className="recipe-metric">
                <Users size={14} /> {recipe.servings} servings
              </span>
            )}
          </div>

          <h3 className="recipe-title">{recipe.title}</h3>
          <p className="recipe-desc">{recipe.description}</p>

          <div className="recipe-macros-row">
            {recipe.protein_grams && (
              <Badge variant="primary" size="sm">
                {recipe.protein_grams}g Protein
              </Badge>
            )}
            {recipe.calories && (
              <Badge variant="cream" size="sm">
                {recipe.calories} kcal
              </Badge>
            )}
          </div>
        </div>

        <div className="recipe-actions">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            leftIcon={<BookOpen size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            View Recipe Guide
          </Button>
        </div>
      </Card>

      {/* Detailed Recipe Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={recipe.title}
        size="lg"
      >
        <div className="recipe-modal-content">
          <div className="modal-hero-img-wrap">
            <img
              src={imgSrc}
              alt={recipe.title}
              onError={() => setImgSrc('/images/protein-combo.jpeg')}
            />
          </div>

          <p className="modal-recipe-desc">{recipe.description}</p>

          {/* Quick Metrics */}
          <div className="modal-metrics-bar">
            <div className="metric-chip">
              <Clock size={16} /> Prep: {recipe.prep_time_minutes || 10}m | Cook: {recipe.cook_time_minutes || 5}m
            </div>
            <div className="metric-chip">
              <Users size={16} /> Servings: {recipe.servings || 2}
            </div>
            <div className="metric-chip">
              <ChefHat size={16} /> Difficulty: {recipe.difficulty || 'Easy'}
            </div>
          </div>

          {/* Ingredients */}
          <div className="modal-section">
            <h4 className="modal-section-title">Ingredients Checklist</h4>
            <ul className="modal-ingredients-list">
              {Array.isArray(recipe.ingredients) ? (
                recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="ingredient-item">
                    <span className="check-bullet"><Check size={12} /></span>
                    <span>{ing}</span>
                  </li>
                ))
              ) : (
                <p className="no-data">Ingredients details available in nutrition guide.</p>
              )}
            </ul>
          </div>

          {/* Instructions */}
          <div className="modal-section">
            <h4 className="modal-section-title">Preparation Instructions</h4>
            <ol className="modal-steps-list">
              {Array.isArray(recipe.instructions) ? (
                recipe.instructions.map((step, idx) => (
                  <li key={idx} className="step-item">
                    <span className="step-num">{idx + 1}</span>
                    <span className="step-text">{step}</span>
                  </li>
                ))
              ) : (
                <p className="no-data">Preparation steps available in nutrition guide.</p>
              )}
            </ol>
          </div>
        </div>
      </Modal>

      <style>{`
        .recipe-card-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }

        .recipe-card-root:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .recipe-media {
          position: relative;
          width: 100%;
          padding-top: 60%;
          background: var(--color-cream-subtle);
          overflow: hidden;
        }

        .recipe-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .recipe-card-root:hover .recipe-image {
          transform: scale(1.05);
        }

        .recipe-badge-stack {
          position: absolute;
          top: var(--space-3);
          left: var(--space-3);
          display: flex;
          gap: var(--space-2);
          z-index: 2;
        }

        .recipe-body {
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          flex: 1;
        }

        .recipe-time-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .recipe-metric {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
        }

        .recipe-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          line-height: var(--line-height-snug);
        }

        .recipe-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .recipe-macros-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: auto;
          padding-top: var(--space-2);
        }

        .recipe-actions {
          padding: 0 var(--space-4) var(--space-4);
        }

        /* Modal Styles */
        .recipe-modal-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .modal-hero-img-wrap {
          width: 100%;
          height: 220px;
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .modal-hero-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-recipe-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .modal-metrics-bar {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .metric-chip {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .modal-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .modal-section-title {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .modal-ingredients-list {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-2);
        }

        @media (min-width: 640px) {
          .modal-ingredients-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .ingredient-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-text-main);
          background: var(--color-cream-subtle);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
        }

        .check-bullet {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-steps-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .step-num {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-full);
          background: var(--color-espresso);
          color: var(--color-cream);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .step-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-main);
          line-height: var(--line-height-relaxed);
          flex: 1;
        }
      `}</style>
    </>
  );
};

export default RecipeCard;
