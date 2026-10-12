import { useState } from "react";
import { Link } from "react-router-dom";
import { extractFacilities } from "../utils/facilities";
import { getMediaUrl } from "../services/api";
import "./TurfCard.css";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80",
];

function TurfCard({ turf, onSelectForPreview, isPreviewSelected }) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Extract primary image URL if available from API images array
  const rawImage =
    turf?.images && turf.images.length > 0
      ? turf.images[0].image_url || turf.images[0].image
      : null;

  const defaultImg = DEFAULT_IMAGES[(turf.id || 0) % DEFAULT_IMAGES.length];
  const imageUrl = rawImage ? getMediaUrl(rawImage) : defaultImg;

  // Derive rating
  const rating = turf.rating || (4.5 + ((turf.id || 1) % 5) * 0.1).toFixed(1);

  // Extract optional facilities added by owner
  const facilities = extractFacilities(turf);

  const priceFormatted = Number(turf.price_per_hour || 2000).toLocaleString("en-IN");

  return (
    <div className={`turf-card-item ${isPreviewSelected ? "selected-preview" : ""}`}>
      {/* CARD IMAGE CONTAINER */}
      <div className="turf-image-wrapper">
        <img
          src={imageUrl}
          alt={turf.name}
          className="turf-card-img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultImg;
          }}
        />

        {/* RATING BADGE */}
        <div className="badge-rating rating-overlay">
          <span>⭐</span> {rating}
        </div>

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
        <h3 className="turf-card-title">{turf.name}</h3>

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
          <span>{turf.location || turf.address || "Hyderabad"}</span>
          {turf.opening_time && turf.closing_time && (
            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#059669", fontWeight: "600" }}>
              ⏰ {turf.opening_time.slice(0, 5)} - {turf.closing_time.slice(0, 5)}
            </span>
          )}
        </div>

        {/* FIXED 1 HOUR BASE PRICE DISPLAY */}
        <div className="turf-card-price-row">
          <span className="price-amount">₹{priceFormatted}</span>
          <span className="price-unit">/ 1 hour</span>
        </div>

        {/* FACILITY PILLS - DISPLAY ONLY IF OWNER ADDED FACILITIES */}
        {facilities.length > 0 && (
          <div className="facility-pill-group">
            {facilities.slice(0, 3).map((facility) => (
              <span key={facility.name || facility} className="facility-tag-pill">
                {facility.name || facility}
              </span>
            ))}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="card-actions-wrapper">
          <Link to={`/turfs/${turf.id}`} className="view-details-pill-btn">
            View Details
          </Link>
          {onSelectForPreview && (
            <button
              type="button"
              className="quick-select-btn"
              onClick={() => onSelectForPreview(turf)}
              title="Select for live booking preview"
            >
              ⚡
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TurfCard;