import React, { useState } from 'react';
import { Calculator, Zap, Flame, Award, ArrowRight } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

/**
 * Interactive Daily Macro & Protein Calculator Component
 */
export const MacroCalculator = ({ reference = {} }) => {
  const [weightKg, setWeightKg] = useState(70);
  const [goal, setGoal] = useState('muscle_building');
  const [activity, setActivity] = useState('moderate');
  const [result, setResult] = useState(null);

  const calculateMacros = (e) => {
    e.preventDefault();
    const weight = Number(weightKg) || 70;

    // Multipliers based on sports nutrition science
    let proteinPerKg = 1.6;
    let calMultiplier = 32;

    if (goal === 'muscle_building') {
      proteinPerKg = 2.0;
      calMultiplier = 36;
    } else if (goal === 'fat_loss') {
      proteinPerKg = 2.2;
      calMultiplier = 26;
    } else if (goal === 'endurance') {
      proteinPerKg = 1.6;
      calMultiplier = 35;
    } else if (goal === 'maintenance') {
      proteinPerKg = 1.4;
      calMultiplier = 30;
    }

    if (activity === 'athlete') {
      calMultiplier += 4;
      proteinPerKg += 0.2;
    } else if (activity === 'sedentary') {
      calMultiplier -= 3;
    }

    const dailyProtein = Math.round(weight * proteinPerKg);
    const dailyCalories = Math.round(weight * calMultiplier);
    const fitbiteBarsRecommended = Math.max(1, Math.round(dailyProtein * 0.25 / 20));

    setResult({
      dailyProtein,
      dailyCalories,
      fitbiteBarsRecommended,
      goalTitle: goal.replace('_', ' ').toUpperCase(),
    });
  };

  return (
    <Card glass padding="lg" className="macro-calculator-root">
      <div className="calc-header">
        <div className="calc-icon-badge">
          <Calculator size={22} />
        </div>
        <div>
          <h3 className="calc-title">Interactive Daily Macro Target Tool</h3>
          <p className="calc-subtitle">
            Calculate your science-backed daily protein and caloric target according to your athletic goals.
          </p>
        </div>
      </div>

      <form onSubmit={calculateMacros} className="calc-form-grid">
        <div className="calc-input-group">
          <label htmlFor="body-weight" className="calc-label">Body Weight (kg)</label>
          <input
            id="body-weight"
            type="number"
            min="35"
            max="200"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="calc-input"
            required
          />
        </div>

        <div className="calc-input-group">
          <label htmlFor="primary-goal" className="calc-label">Primary Fitness Goal</label>
          <select
            id="primary-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="calc-input"
          >
            <option value="muscle_building">Muscle Hypertrophy & Strength</option>
            <option value="fat_loss">Fat Loss & Muscle Preservation</option>
            <option value="endurance">Endurance & Marathon Fueling</option>
            <option value="maintenance">Lean Athletic Maintenance</option>
          </select>
        </div>

        <div className="calc-input-group">
          <label htmlFor="activity-level" className="calc-label">Weekly Activity Intensity</label>
          <select
            id="activity-level"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="calc-input"
          >
            <option value="moderate">Moderate Training (3-5 sessions/wk)</option>
            <option value="athlete">High Intensity Athlete (6+ sessions/wk)</option>
            <option value="sedentary">Light / Sedentary (1-2 sessions/wk)</option>
          </select>
        </div>

        <div className="calc-btn-wrap">
          <Button variant="primary" size="md" type="submit" fullWidth rightIcon={<ArrowRight size={16} />}>
            Compute Target
          </Button>
        </div>
      </form>

      {result && (
        <div className="calc-result-panel animate-slideUp">
          <div className="result-metric-box">
            <div className="metric-icon protein-icon">
              <Zap size={22} />
            </div>
            <div>
              <p className="metric-number">{result.dailyProtein}g</p>
              <p className="metric-name">Daily Protein Target</p>
            </div>
          </div>

          <div className="result-metric-box">
            <div className="metric-icon calorie-icon">
              <Flame size={22} />
            </div>
            <div>
              <p className="metric-number">{result.dailyCalories} kcal</p>
              <p className="metric-name">Target Daily Energy</p>
            </div>
          </div>

          <div className="result-metric-box">
            <div className="metric-icon bar-icon">
              <Award size={22} />
            </div>
            <div>
              <p className="metric-number">{result.fitbiteBarsRecommended} Bar(s)</p>
              <p className="metric-name">Optimal FitBite Intake</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .macro-calculator-root {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
        }

        .calc-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .calc-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-xl);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .calc-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: 2px;
        }

        .calc-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .calc-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 768px) {
          .calc-form-grid {
            grid-template-columns: repeat(3, 1fr) 180px;
            align-items: flex-end;
          }
        }

        .calc-input-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .calc-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .calc-input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-card);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
          font-family: var(--font-sans);
          outline: none;
        }

        .calc-input:focus {
          border-color: var(--color-primary);
        }

        .calc-btn-wrap {
          display: flex;
          align-items: flex-end;
        }

        .calc-result-panel {
          margin-top: var(--space-6);
          padding: var(--space-6);
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-primary-light);
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 768px) {
          .calc-result-panel {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .result-metric-box {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-3);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-lg);
        }

        .metric-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .protein-icon {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }

        .calorie-icon {
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        .bar-icon {
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .metric-number {
          font-family: var(--font-heading);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.1;
        }

        .metric-name {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          font-weight: var(--font-weight-medium);
        }
      `}</style>
    </Card>
  );
};

export default MacroCalculator;
