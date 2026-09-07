import React, { useState } from 'react';

/**
 * Interactive Product Image Gallery with Thumbnails and Fallback Recovery
 */
export const ImageGallery = ({ images = [], productName = 'FitBite Protein Bar' }) => {
  const fallbackImage = '/images/protein-combo.jpeg';
  const initialImage = images && images.length > 0
    ? (images.find((img) => img.is_primary)?.image_url || images[0].image_url)
    : fallbackImage;

  const [activeImage, setActiveImage] = useState(initialImage);
  const [activeAlt, setActiveAlt] = useState(productName);

  // If images list changes
  React.useEffect(() => {
    if (images && images.length > 0) {
      const primary = images.find((img) => img.is_primary) || images[0];
      setActiveImage(primary.image_url || fallbackImage);
      setActiveAlt(primary.alt_text || productName);
    } else {
      setActiveImage(fallbackImage);
      setActiveAlt(productName);
    }
  }, [images, productName]);

  return (
    <div className="image-gallery-root">
      {/* Main Large Image View */}
      <div className="main-image-wrap">
        <img
          src={activeImage}
          alt={activeAlt}
          className="main-gallery-img"
          onError={() => setActiveImage(fallbackImage)}
        />
      </div>

      {/* Thumbnails Row (if more than 1 image exists) */}
      {images && images.length > 1 && (
        <div className="thumbnails-row">
          {images.map((img, idx) => {
            const isSelected = activeImage === img.image_url;
            return (
              <button
                key={img.id || idx}
                type="button"
                className={`thumb-btn ${isSelected ? 'thumb-active' : ''}`}
                onClick={() => {
                  setActiveImage(img.image_url);
                  setActiveAlt(img.alt_text || `${productName} view ${idx + 1}`);
                }}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || productName}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        .image-gallery-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          width: 100%;
        }

        .main-image-wrap {
          position: relative;
          width: 100%;
          padding-top: 85%;
          background: var(--color-cream-subtle);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .main-gallery-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .main-image-wrap:hover .main-gallery-img {
          transform: scale(1.04);
        }

        .thumbnails-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          overflow-x: auto;
          padding-bottom: var(--space-1);
        }

        .thumb-btn {
          width: 70px;
          height: 70px;
          border-radius: var(--radius-lg);
          border: 2px solid var(--color-border);
          background: var(--color-bg-card);
          padding: 2px;
          cursor: pointer;
          overflow: hidden;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }

        .thumb-btn:hover {
          border-color: var(--color-primary-light);
        }

        .thumb-btn.thumb-active {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(200, 122, 62, 0.2);
        }

        .thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
};

export default ImageGallery;
