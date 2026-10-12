import { useState } from "react";
import "./HeroSection.css";

function HeroSection({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="hero-card-container">
      <div className="hero-content-wrapper">
        {/* PLATFORM BADGE */}
        <div className="hero-badge-tag">
          <span className="badge-leaf">🌿</span>
          <span>#1 Turf Booking Platform</span>
        </div>

        {/* MAIN HEADLINE */}
        <h1 className="hero-main-title">
          Find Your <br />
          <span className="hero-green-highlight">Perfect Turf</span>
        </h1>

        {/* SUBTITLE */}
        <p className="hero-subtitle">
          Book premium turfs for football, cricket, badminton and more.
          <br />
          Play your game, your way.
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
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search location, turf name or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="hero-search-submit-btn">
            Search
          </button>
        </form>
      </div>

      {/* BACKGROUND GRAPHIC DECORATIONS */}
      <div className="hero-graphic-bg">
        <div className="hero-circle-accent accent-1"></div>
        <div className="hero-circle-accent accent-2"></div>
        <div className="hero-decor-badge">
          <span>Good Games</span>
          <strong>Better People</strong>
        </div>
        <img
          src="https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80"
          alt="Soccer Ball Hero"
          className="hero-soccer-image"
        />
      </div>
    </div>
  );
}

export default HeroSection;
