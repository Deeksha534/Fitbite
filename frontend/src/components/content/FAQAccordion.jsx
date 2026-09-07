import React, { useState, useMemo } from 'react';
import { ChevronDown, HelpCircle, Search, X } from 'lucide-react';
import Input from '../common/Input';
import Card from '../common/Card';

/**
 * Categorized FAQ Accordion with Search Filtering
 */
export const FAQAccordion = ({ faqData = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState({});

  const categories = useMemo(() => {
    const list = ['All'];
    if (Array.isArray(faqData)) {
      faqData.forEach((cat) => {
        if (cat.category && !list.includes(cat.category)) {
          list.push(cat.category);
        }
      });
    }
    return list;
  }, [faqData]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(faqData)) return [];

    let flatList = [];
    faqData.forEach((catGroup) => {
      const categoryName = catGroup.category || 'General';
      if (Array.isArray(catGroup.items)) {
        catGroup.items.forEach((item, idx) => {
          flatList.push({
            ...item,
            category: categoryName,
            uniqueKey: `${categoryName}-${idx}`,
          });
        });
      }
    });

    return flatList.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.question && item.question.toLowerCase().includes(q)) ||
        (item.answer && item.answer.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [faqData, selectedCategory, searchQuery]);

  const toggleItem = (key) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="faq-accordion-root">
      {/* Search & Category Filter */}
      <div className="faq-controls">
        <div className="faq-search-wrap">
          <Input
            placeholder="Search questions or keywords (e.g. shipping, whey, shelf life)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
            rightIcon={
              searchQuery ? (
                <button
                  type="button"
                  className="clear-faq-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null
            }
          />
        </div>

        <div className="faq-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`faq-cat-pill ${selectedCategory === cat ? 'cat-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="faq-items-list">
        {filteredItems.length === 0 ? (
          <div className="no-faq-match">
            <HelpCircle size={32} className="no-match-icon" />
            <p>No answers found matching "{searchQuery}". Please try another keyword or browse all questions.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOpen = Boolean(openItems[item.uniqueKey]);
            return (
              <div
                key={item.uniqueKey}
                className={`faq-item-card ${isOpen ? 'faq-item-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleItem(item.uniqueKey)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <span className="faq-category-tag">{item.category}</span>
                  <ChevronDown size={18} className="faq-chevron" />
                </button>

                {isOpen && (
                  <div className="faq-answer-panel animate-fadeIn">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .faq-accordion-root {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .faq-controls {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .faq-search-wrap {
          max-width: 600px;
          width: 100%;
        }

        .clear-faq-search {
          background: none;
          border: none;
          color: var(--color-text-subtle);
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .faq-category-pills {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-1);
          scrollbar-width: none;
        }

        .faq-category-pills::-webkit-scrollbar {
          display: none;
        }

        .faq-cat-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.4rem 0.9rem;
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

        .faq-cat-pill:hover {
          background: var(--color-cream-subtle);
          border-color: var(--color-primary-light);
        }

        .faq-cat-pill.cat-active {
          background: var(--color-espresso);
          color: var(--color-cream);
          border-color: var(--color-espresso);
        }

        .faq-items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .faq-item-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .faq-item-card:hover {
          border-color: var(--color-primary-light);
        }

        .faq-item-open {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .faq-question-btn {
          width: 100%;
          padding: var(--space-4) var(--space-5);
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
        }

        .faq-question-text {
          flex: 1;
          font-family: var(--font-heading);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          line-height: var(--line-height-snug);
        }

        .faq-category-tag {
          font-size: 0.65rem;
          padding: 0.15rem 0.5rem;
          background: var(--color-cream-subtle);
          color: var(--color-text-subtle);
          border-radius: var(--radius-full);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: none;
        }

        @media (min-width: 640px) {
          .faq-category-tag {
            display: inline-block;
          }
        }

        .faq-chevron {
          color: var(--color-primary);
          transition: transform var(--transition-normal);
          flex-shrink: 0;
        }

        .faq-item-open .faq-chevron {
          transform: rotate(180deg);
        }

        .faq-answer-panel {
          padding: 0 var(--space-5) var(--space-5);
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          border-top: 1px solid var(--color-border-subtle);
          padding-top: var(--space-3);
        }

        .no-faq-match {
          text-align: center;
          padding: var(--space-10);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-xl);
          border: 1px dashed var(--color-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        .no-match-icon {
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};

export default FAQAccordion;
