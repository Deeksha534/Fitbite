import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Sparkles, Filter, AlertCircle, BookOpen } from 'lucide-react';
import RecipeCard from '../../components/content/RecipeCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { contentService } from '../../services/contentService';

/**
 * FitBite High-Protein Gourmet Recipes Page
 */
export const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await contentService.getRecipes();
        setRecipes(data.recipes || []);
      } catch (err) {
        console.error('Failed to load recipes:', err);
        setError(err.message || 'Unable to retrieve gourmet recipes at this time.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = useMemo(() => {
    const set = new Set(['All']);
    recipes.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchCat = selectedCategory === 'All' || r.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'All' || r.difficulty === selectedDifficulty;
      return matchCat && matchDiff;
    });
  }, [recipes, selectedCategory, selectedDifficulty]);

  return (
    <div className="recipes-page-root">
      {/* Header Hero */}
      <section className="recipes-hero-section">
        <div className="container">
          <div className="recipes-hero-content animate-slideUp">
            <Badge variant="espresso" size="md">
              <ChefHat size={14} /> Artisan Kitchen Creations
            </Badge>
            <h1 className="recipes-hero-title">
              Fuel Your Day With <span className="text-gradient">Gourmet Recipes.</span>
            </h1>
            <p className="recipes-hero-desc">
              Discover macro-optimized breakfasts, smoothie bowls, and guilt-free desserts crafted around your favorite FitBite protein bars.
            </p>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <div className="container recipes-body-section">
        {/* Category Pills & Filters */}
        <div className="recipes-filters-bar">
          <div className="cat-pills-row">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`recipe-cat-pill ${selectedCategory === cat ? 'cat-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="difficulty-filter-wrap">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="diff-select"
              aria-label="Filter by difficulty"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy (Under 15m)</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Advanced</option>
            </select>
          </div>
        </div>

        {/* Content Display */}
        {isLoading ? (
          <Spinner centered size="lg" label="Loading delicious high-protein recipes..." />
        ) : error ? (
          <div className="recipe-error-box">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="no-recipes-box">
            <BookOpen size={36} className="no-recipe-icon" />
            <h3>No Recipes In This Category</h3>
            <p>Try switching to another category or reset your difficulty filter.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDifficulty('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="recipes-grid">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .recipes-page-root {
          width: 100%;
        }

        .recipes-hero-section {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-12) 0 var(--space-10);
          text-align: center;
          border-bottom: 1px solid var(--color-border);
        }

        .recipes-hero-content {
          max-width: 780px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .recipes-hero-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.15;
        }

        @media (min-width: 768px) {
          .recipes-hero-title {
            font-size: var(--font-size-4xl);
          }
        }

        .recipes-hero-desc {
          font-size: var(--font-size-md);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .recipes-body-section {
          padding-top: var(--space-8);
          padding-bottom: var(--space-16);
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .recipes-filters-bar {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        @media (min-width: 768px) {
          .recipes-filters-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .cat-pills-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-1);
          scrollbar-width: none;
        }

        .cat-pills-row::-webkit-scrollbar {
          display: none;
        }

        .recipe-cat-pill {
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

        .recipe-cat-pill:hover {
          background: var(--color-cream-subtle);
          border-color: var(--color-primary-light);
        }

        .recipe-cat-pill.cat-active {
          background: var(--color-espresso);
          color: var(--color-cream);
          border-color: var(--color-espresso);
        }

        .diff-select {
          padding: var(--space-2) var(--space-4);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          background: var(--color-bg-card);
          color: var(--color-espresso);
          cursor: pointer;
          outline: none;
        }

        .recipes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 640px) {
          .recipes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .recipes-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .recipe-error-box {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-danger);
          padding: var(--space-6);
          background: var(--color-danger-bg);
          border-radius: var(--radius-xl);
        }

        .no-recipes-box {
          text-align: center;
          padding: var(--space-12);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-xl);
          border: 1px dashed var(--color-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }

        .no-recipe-icon {
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};

export default RecipesPage;
