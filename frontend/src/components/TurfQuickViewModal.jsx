import { useState } from "react";
import { Link } from "react-router-dom";
import BookingPanel from "./BookingPanel";
import { getMediaUrl } from "../services/api";
import "./TurfQuickViewModal.css";

const DEFAULT_MODAL_IMAGES = [
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=800&q=80",
];

function TurfQuickViewModal({ turf, onClose }) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!turf) return null;

  const images =
    turf.images && turf.images.length > 0
      ? turf.images.map((img) => getMediaUrl(img.image_url || img.image))
      : DEFAULT_MODAL_IMAGES;

  const currentImg = images[activeImageIdx] || images[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-icon-btn" onClick={onClose}>
          ✕
        </button>

        <div className="modal-body-grid">
          {/* LEFT SIDE: PREVIEW INFO & GALLERY */}
          <div className="modal-left-info">
            <div className="modal-image-view">
              <img
                src={currentImg}
                alt={turf.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_MODAL_IMAGES[0];
                }}
              />
              {images.length > 1 && (
                <div className="modal-thumb-row">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`modal-thumb ${activeImageIdx === i ? "active" : ""}`}
                      onClick={() => setActiveImageIdx(i)}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${i}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_MODAL_IMAGES[0];
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-header-info">
              <h2>{turf.name}</h2>
              <p className="modal-address">📍 {turf.address || turf.location}</p>
              <div className="badge-rating">⭐ {turf.rating || "4.8"} (120+ verified reviews)</div>
            </div>

            {turf.description && (
              <div className="modal-desc-box">
                <h4>About</h4>
                <p>{turf.description}</p>
              </div>
            )}

            <Link to={`/turfs/${turf.id}`} className="view-full-page-btn" onClick={onClose}>
              View Full Details & Reviews →
            </Link>
          </div>

          {/* RIGHT SIDE: LIVE BOOKING WIDGET */}
          <div className="modal-right-booking">
            <BookingPanel turf={turf} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TurfQuickViewModal;
