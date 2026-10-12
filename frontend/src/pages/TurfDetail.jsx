import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BookingPanel from "../components/BookingPanel";
import Toast from "../components/Toast";
import { fetchTurfById, getMediaUrl } from "../services/api";
import { extractFacilities } from "../utils/facilities";
import "./TurfDetail.css";

const DEFAULT_GALLERY = [
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
];

const CUSTOMER_REVIEWS = [
  {
    id: 1,
    name: "Rahul Verma",
    rating: 5,
    date: "2 days ago",
    comment: "Top notch turf surface! The floodlights are bright and parking was super smooth.",
    sport: "Football ⚽",
  },
  {
    id: 2,
    name: "Priya Sharma",
    rating: 5,
    date: "1 week ago",
    comment: "Excellent experience for box cricket with colleagues. Very clean changing rooms.",
    sport: "Cricket 🏏",
  },
  {
    id: 3,
    name: "Vikram Reddy",
    rating: 4,
    date: "2 weeks ago",
    comment: "Great location and easy booking flow. Will definitely book again!",
    sport: "Badminton 🏸",
  },
];

function TurfDetail() {
  const { turfId } = useParams();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadTurfData() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTurfById(turfId);
        if (isMounted) setTurf(data);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load turf details");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTurfData();
    return () => {
      isMounted = false;
    };
  }, [turfId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastMsg("Turf link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="turf-detail-container loading">
        <div className="skeleton" style={{ height: "400px", borderRadius: "24px" }}></div>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="turf-detail-container error-state">
        <h2>Turf Not Found</h2>
        <p>{error || "Unable to display turf details."}</p>
        <Link to="/turfs" className="btn-primary">
          Back to Turfs
        </Link>
      </div>
    );
  }

  const gallery =
    turf.images && turf.images.length > 0
      ? turf.images.map((img) => getMediaUrl(img.image_url || img.image))
      : DEFAULT_GALLERY;

  const currentImage = gallery[activeImageIndex] || gallery[0];
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${turf.name} ${turf.address || turf.location}`
  )}`;

  // Extract optional facilities added by owner
  const facilities = extractFacilities(turf);

  return (
    <div className="turf-detail-container">
      <Toast message={toastMsg} onClose={() => setToastMsg("")} />

      {/* LEFT COLUMN: GALLERY & DETAILS */}
      <div className="detail-left-column">
        {/* BREADCRUMB & SHARE ACTION */}
        <div className="breadcrumb-nav-row">
          <div className="breadcrumb-nav">
            <Link to="/">Home</Link> / <Link to="/turfs">Turfs</Link> / <span>{turf.name}</span>
          </div>
          <button className="btn-outline share-btn" onClick={handleShare}>
            🔗 Share Turf
          </button>
        </div>

        {/* IMAGE GALLERY */}
        <div className="gallery-section">
          <div className="main-image-box">
            <img
              src={currentImage}
              alt={turf.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_GALLERY[0];
              }}
            />
          </div>
          <div className="gallery-thumbnails">
            {gallery.map((imgUrl, index) => (
              <button
                key={index}
                className={`thumb-btn ${activeImageIndex === index ? "active" : ""}`}
                onClick={() => setActiveImageIndex(index)}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${index + 1}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_GALLERY[0];
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* HEADER INFORMATION */}
        <div className="detail-header-card">
          <div className="title-row">
            <h1>{turf.name}</h1>
            <div className="badge-rating">⭐ {turf.rating || "4.8"} (120+ verified reviews)</div>
          </div>
          <p className="detail-address">📍 {turf.address || turf.location}</p>
          {turf.opening_time && turf.closing_time && (
            <p className="detail-timing-row" style={{ color: "#047857", fontWeight: "600", fontSize: "0.92rem", margin: "0.4rem 0 0.8rem 0" }}>
              ⏰ <strong>Operating Hours:</strong> {turf.opening_time.slice(0, 5)} to {turf.closing_time.slice(0, 5)} (Slots available strictly during these hours)
            </p>
          )}
          <div className="price-tag-large">
            ₹{Number(turf.price_per_hour).toLocaleString("en-IN")}
            <span className="price-per"> / 1 hour</span>
          </div>
        </div>

        {/* ABOUT & DESCRIPTION */}
        {turf.description && (
          <div className="detail-info-block">
            <h2>About this Turf</h2>
            <p className="description-text">{turf.description}</p>

            <div className="location-description-box">
              <div className="loc-box-title">📍 Location Details</div>
              <div className="loc-box-row">
                <strong>Region / Area:</strong> <span>{turf.location}</span>
              </div>
              {turf.address && (
                <div className="loc-box-row">
                  <strong>Full Address:</strong> <span>{turf.address}</span>
                </div>
              )}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="directions-link"
              >
                🗺️ Open in Google Maps →
              </a>
            </div>
          </div>
        )}

        {/* FACILITIES GRID - DISPLAY ONLY IF OWNER ADDED DETAILS */}
        {facilities.length > 0 && (
          <div className="detail-info-block">
            <h2>Facilities & Amenities</h2>
            <div className="amenities-grid">
              {facilities.map((fac, idx) => (
                <div key={idx} className="amenity-item">
                  {fac.icon || "⚡"} {fac.name || fac}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS & RATINGS UPGRADE */}
        <div className="detail-info-block">
          <div className="reviews-header">
            <h2>Customer Reviews ({CUSTOMER_REVIEWS.length})</h2>
            <span className="rating-summary-pill">⭐ 4.8 / 5.0</span>
          </div>

          <div className="reviews-list">
            {CUSTOMER_REVIEWS.map((rev) => (
              <div key={rev.id} className="review-card">
                <div className="review-top-row">
                  <div className="reviewer-info">
                    <strong>{rev.name}</strong>
                    <span className="review-sport-tag">{rev.sport}</span>
                  </div>
                  <span className="review-date">{rev.date}</span>
                </div>
                <div className="review-stars">{"⭐".repeat(rev.rating)}</div>
                <p className="review-comment">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE BOOKING PANEL */}
      <div className="detail-right-column">
        <BookingPanel turf={turf} />
      </div>
    </div>
  );
}

export default TurfDetail;
