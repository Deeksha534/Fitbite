import React from 'react';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import Badge from '../common/Badge';

/**
 * Standard Nutrition Facts Table & Ingredients Breakdown
 */
export const NutritionFactsTable = ({ product }) => {
  if (!product) return null;

  const protein = Number(product.protein_grams || 20);
  const fiber = Number(product.fiber_grams || 10);
  const sugar = Number(product.sugar_grams || 0);
  const calories = Number(product.calories || 210);

  // Estimates based on standard clean bar profile
  const totalFat = Math.max(4, Math.round((calories - (protein * 4) - (fiber * 2) - 40) / 9)) || 6;
  const carbs = Math.max(15, fiber + sugar + 6);

  return (
    <div className="nutrition-facts-container">
      <div className="nutrition-facts-grid">
        {/* FDA Style Nutrition Facts Label Box */}
        <div className="nutrition-label-box">
          <h4 className="nutrition-label-title">Nutrition Facts</h4>
          <p className="nutrition-serving">1 bar (60g)</p>
          <div className="thick-bar" />

          <div className="nutrition-calories-row">
            <span className="cal-label">Calories</span>
            <span className="cal-val">{calories}</span>
          </div>
          <div className="medium-bar" />

          <div className="daily-value-header">% Daily Value*</div>
          <div className="thin-bar" />

          <div className="nutrition-row">
            <span><strong>Total Fat</strong> {totalFat}g</span>
            <span><strong>{Math.round((totalFat / 78) * 100)}%</strong></span>
          </div>
          <div className="thin-bar" />

          <div className="nutrition-row sub-row">
            <span>Saturated Fat 1.5g</span>
            <span>8%</span>
          </div>
          <div className="thin-bar" />

          <div className="nutrition-row">
            <span><strong>Sodium</strong> 140mg</span>
            <span><strong>6%</strong></span>
          </div>
          <div className="thin-bar" />

          <div className="nutrition-row">
            <span><strong>Total Carbohydrate</strong> {carbs}g</span>
            <span><strong>{Math.round((carbs / 275) * 100)}%</strong></span>
          </div>
          <div className="thin-bar" />

          <div className="nutrition-row sub-row">
            <span>Dietary Fiber {fiber}g</span>
            <span>{Math.round((fiber / 28) * 100)}%</span>
          </div>
          <div className="thin-bar" />

          <div className="nutrition-row sub-row">
            <span>Total Sugars {sugar}g</span>
            <span></span>
          </div>
          <div className="thin-bar" />

          <div className="nutrition-row sub-sub-row">
            <span>Includes 0g Added Sugars</span>
            <span>0%</span>
          </div>
          <div className="medium-bar" />

          <div className="nutrition-row highlight-row">
            <span><strong>Protein</strong> {protein}g</span>
            <span><strong>{Math.round((protein / 50) * 100)}%</strong></span>
          </div>
          <div className="thick-bar" />

          <p className="nutrition-disclaimer">
            * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
          </p>
        </div>

        {/* Clean Ingredients & Guarantee Box */}
        <div className="ingredients-details-box">
          <div className="details-section">
            <h5 className="details-heading">
              <Sparkles size={18} className="icon-sparkle" /> Artisan Ingredients
            </h5>
            <p className="ingredients-text">
              Whey Protein Isolate, Prebiotic Soluble Tapioca Fiber, Chicory Root Extract, Almond Butter, Dark Cocoa Solids, Organic Coconut Oil, Natural Flavors, Sunflower Lecithin, Pink Himalayan Salt, Stevia Leaf Extract.
            </p>
          </div>

          <div className="details-section">
            <h5 className="details-heading">
              <ShieldCheck size={18} className="icon-shield" /> Allergen Information
            </h5>
            <p className="allergen-text">
              <strong>Contains:</strong> Milk (Whey Protein Isolate) and Tree Nuts (Almonds).<br />
              <strong>Facility Note:</strong> Produced on dedicated allergen-sanitized lines that also process peanuts, sesame, and soy. Gluten-Free certified.
            </p>
          </div>

          <div className="details-badges-grid">
            <div className="quality-pill">
              <CheckCircle2 size={16} /> Gluten Free
            </div>
            <div className="quality-pill">
              <CheckCircle2 size={16} /> Non-GMO
            </div>
            <div className="quality-pill">
              <CheckCircle2 size={16} /> No Artificial Sweeteners
            </div>
            <div className="quality-pill">
              <CheckCircle2 size={16} /> 100% Microfiltered Whey
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nutrition-facts-container {
          width: 100%;
          padding: var(--space-4) 0;
        }

        .nutrition-facts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
          align-items: start;
        }

        @media (min-width: 768px) {
          .nutrition-facts-grid {
            grid-template-columns: 320px 1fr;
            gap: var(--space-10);
          }
        }

        .nutrition-label-box {
          background: #ffffff;
          border: 2px solid var(--color-espresso);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          font-family: var(--font-sans);
          box-shadow: var(--shadow-sm);
        }

        .nutrition-label-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1;
          margin-bottom: 2px;
        }

        .nutrition-serving {
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-2);
        }

        .thick-bar {
          height: 8px;
          background: var(--color-espresso);
          margin: 4px 0;
        }

        .medium-bar {
          height: 4px;
          background: var(--color-espresso);
          margin: 4px 0;
        }

        .thin-bar {
          height: 1px;
          background: var(--color-border);
          margin: 3px 0;
        }

        .nutrition-calories-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: var(--space-1) 0;
        }

        .cal-label {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        .cal-val {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        .daily-value-header {
          text-align: right;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          padding: 2px 0;
        }

        .nutrition-row {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
          padding: 2px 0;
        }

        .sub-row {
          padding-left: var(--space-3);
        }

        .sub-sub-row {
          padding-left: var(--space-6);
        }

        .highlight-row {
          font-size: var(--font-size-base);
          background: var(--color-primary-light);
          padding: 4px var(--space-2);
          border-radius: var(--radius-sm);
        }

        .nutrition-disclaimer {
          font-size: 0.68rem;
          color: var(--color-text-subtle);
          line-height: 1.3;
          margin-top: var(--space-3);
        }

        .ingredients-details-box {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .details-section {
          background: var(--color-bg-card);
          padding: var(--space-6);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
        }

        .details-heading {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: var(--space-3);
        }

        .icon-sparkle {
          color: var(--color-primary);
        }

        .icon-shield {
          color: var(--color-success);
        }

        .ingredients-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .allergen-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .details-badges-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
        }

        .quality-pill {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .quality-pill svg {
          color: var(--color-success);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default NutritionFactsTable;
