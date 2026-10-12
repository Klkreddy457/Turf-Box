import { useState } from "react";
import { Link } from "react-router-dom";
import { extractFacilities } from "../utils/facilities";
import { getMediaUrl } from "../services/api";
import "./TurfCard.css";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
];

function TurfCard({ turf, onSelectForPreview, isPreviewSelected }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Extract gallery images
  const imagesList =
    turf?.images && turf.images.length > 0
      ? turf.images.map((img) => img.image_url || getMediaUrl(img.image))
      : [DEFAULT_IMAGES[(turf.id || 0) % DEFAULT_IMAGES.length]];

  const currentImage = imagesList[activeImgIndex] || imagesList[0];

  // Derive rating & sport badge
  const rating = turf.rating || (4.6 + ((turf.id || 1) % 4) * 0.1).toFixed(1);
  const reviewsCount = turf.reviews_count || (150 + ((turf.id || 1) * 37) % 300);
  const facilities = extractFacilities(turf);
  const priceFormatted = Number(turf.price_per_hour || 1200).toLocaleString("en-IN");
  const badgeText = turf.badge || (turf.sport ? `${turf.sport} Arena` : "Verified Turf");

  return (
    <div className={`turf-card-item ${isPreviewSelected ? "selected-preview" : ""}`}>
      {/* CARD IMAGE CONTAINER */}
      <div className="turf-image-wrapper">
        <img
          src={currentImage}
          alt={turf.name}
          className="turf-card-img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_IMAGES[0];
          }}
        />

        {/* SPORT BADGE */}
        <div className="turf-badge-overlay">
          <span>{badgeText}</span>
        </div>

        {/* RATING BADGE */}
        <div className="badge-rating rating-overlay">
          <span>⭐</span> {rating} <span className="review-count">({reviewsCount})</span>
        </div>

        {/* IMAGE THUMBNAIL DOTS */}
        {imagesList.length > 1 && (
          <div className="card-image-dots">
            {imagesList.map((_, idx) => (
              <span
                key={idx}
                className={`dot-pill ${idx === activeImgIndex ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex(idx);
                }}
              />
            ))}
          </div>
        )}

        {/* FAVORITE BUTTON */}
        <button
          type="button"
          className={`favorite-btn ${isFavorite ? "fav-active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          title={isFavorite ? "Remove favorite" : "Add to favorites"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isFavorite ? "#ef4444" : "none"}
            stroke={isFavorite ? "#ef4444" : "#ffffff"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* CARD BODY CONTENT */}
      <div className="turf-card-body">
        <div className="turf-card-header-row">
          <h3 className="turf-card-title">{turf.name}</h3>
        </div>

        <div className="turf-card-location">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pin-icon"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="location-name">{turf.location || turf.address || "Hyderabad"}</span>
        </div>

        {turf.opening_time && turf.closing_time && (
          <div className="turf-card-timing">
            <span className="clock-icon">⏰</span>
            <span>Open: {turf.opening_time.slice(0, 5)} - {turf.closing_time.slice(0, 5)}</span>
            <span className="live-status-pill">Available Today</span>
          </div>
        )}

        {/* FACILITY PILLS */}
        {facilities.length > 0 && (
          <div className="facility-pill-group">
            {facilities.slice(0, 3).map((facility) => (
              <span key={facility.name || facility} className="facility-tag-pill">
                <span>{facility.icon || "⚡"}</span> {facility.name || facility}
              </span>
            ))}
            {facilities.length > 3 && (
              <span className="facility-tag-pill facility-more-pill">
                +{facilities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* PRICE ROW & ACTIONS */}
        <div className="turf-card-footer">
          <div className="turf-card-price-row">
            <span className="price-label">Starting at</span>
            <div className="price-val-wrap">
              <span className="price-amount">₹{priceFormatted}</span>
              <span className="price-unit">/ hr</span>
            </div>
          </div>

          <div className="card-actions-wrapper">
            {onSelectForPreview && (
              <button
                type="button"
                className="quick-preview-btn"
                onClick={() => onSelectForPreview(turf)}
                title="Quick slot preview"
              >
                Preview
              </button>
            )}
            <Link to={`/booking/${turf.id}`} className="book-now-btn">
              Book Slot
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TurfCard;