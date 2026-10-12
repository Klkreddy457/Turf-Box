import { useState } from "react";
import "./HeroSection.css";

const QUICK_SEARCH_CHIPS = [
  { label: "Football ⚽", query: "Football" },
  { label: "Box Cricket 🏏", query: "Cricket" },
  { label: "Badminton 🏸", query: "Badminton" },
  { label: "Basketball 🏀", query: "Basketball" },
  { label: "Tennis 🎾", query: "Tennis" },
  { label: "Futsal 🥅", query: "Futsal" },
];

function HeroSection({ onSearch, onSelectCategory }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleChipClick = (query) => {
    setSearchQuery(query);
    if (onSearch) onSearch(query);
  };

  return (
    <div className="hero-card-container">
      <div className="hero-content-wrapper">
        {/* PLATFORM BADGE */}
        <div className="hero-badge-tag">
          <span className="live-pulse-dot"></span>
          <span>Verified Outside-World Sports Arenas</span>
        </div>

        {/* MAIN HEADLINE */}
        <h1 className="hero-main-title">
          Book Top Turfs <br />
          <span className="hero-green-highlight">Play Your Best Game.</span>
        </h1>

        {/* SUBTITLE */}
        <p className="hero-subtitle">
          Find and reserve authentic tournament-grade Football, Box Cricket, Badminton, Basketball, and Tennis turfs with real floodlit photos, live slot availability, and instant confirmation.
        </p>

        {/* SEARCH FORM */}
        <form onSubmit={handleSubmit} className="hero-search-bar">
          <div className="search-input-wrapper">
            <svg
              className="search-bar-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search by turf name, location (e.g. Gachibowli, Koramangala) or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="hero-search-submit-btn">
            Find Turfs
          </button>
        </form>

        {/* QUICK SEARCH CHIPS */}
        <div className="hero-quick-chips">
          <span className="chips-label">Popular Sports:</span>
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip.query}
              type="button"
              className="quick-chip-btn"
              onClick={() => handleChipClick(chip.query)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* METRICS ROW */}
        <div className="hero-stats-row">
          <div className="hero-stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Verified Venues</span>
          </div>
          <div className="stat-divider"></div>
          <div className="hero-stat-item">
            <span className="stat-number">15K+</span>
            <span className="stat-label">Slots Booked</span>
          </div>
          <div className="stat-divider"></div>
          <div className="hero-stat-item">
            <span className="stat-number">4.9★</span>
            <span className="stat-label">Player Rating</span>
          </div>
          <div className="stat-divider"></div>
          <div className="hero-stat-item">
            <span className="stat-number">⚡ Instant</span>
            <span className="stat-label">Confirmation</span>
          </div>
        </div>
      </div>

      {/* BACKGROUND GRAPHIC DECORATIONS */}
      <div className="hero-graphic-bg">
        <div className="hero-circle-accent accent-1"></div>
        <div className="hero-circle-accent accent-2"></div>
        
        <div className="hero-floating-card card-top">
          <div className="float-icon">⚽</div>
          <div>
            <strong>FIFA-Certified</strong>
            <p>50mm AstroTurf</p>
          </div>
        </div>

        <div className="hero-floating-card card-bottom">
          <div className="float-icon">🏸</div>
          <div>
            <strong>BWF Synthetic</strong>
            <p>Air-Conditioned Courts</p>
          </div>
        </div>

        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80"
          alt="Night Sports Turf Arena"
          className="hero-soccer-image"
        />
      </div>
    </div>
  );
}

export default HeroSection;
