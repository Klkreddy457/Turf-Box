import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import TurfCard from "../components/TurfCard";
import CategorySelector from "../components/CategorySelector";
import TurfQuickViewModal from "../components/TurfQuickViewModal";
import Toast from "../components/Toast";
import { fetchTurfs } from "../services/api";
import "./Turfs.css";

const CITIES = ["All", "Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Chennai"];

function Turfs() {
  const [searchParams] = useSearchParams();
  const [turfs, setTurfs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("sport") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("location") || "");
  const [selectedCity, setSelectedCity] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [quickViewTurf, setQuickViewTurf] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTurfs() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTurfs();
        setTurfs(data);
      } catch (err) {
        setError(err.message || "Failed to load turfs");
      } finally {
        setLoading(false);
      }
    }

    loadTurfs();
  }, []);

  // Sync when searchParams change
  useEffect(() => {
    const sport = searchParams.get("sport");
    const loc = searchParams.get("location");
    if (sport) setSelectedCategory(sport);
    if (loc) {
      if (CITIES.includes(loc)) {
        setSelectedCity(loc);
      } else {
        setSearchQuery(loc);
      }
    }
  }, [searchParams]);

  const filteredTurfs = useMemo(() => {
    let result = [...turfs];

    if (selectedCategory) {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter(
        (t) =>
          (t.sport && t.sport.toLowerCase().includes(catLower)) ||
          t.name.toLowerCase().includes(catLower) ||
          (t.description && t.description.toLowerCase().includes(catLower))
      );
    }

    if (selectedCity && selectedCity !== "All") {
      const cityLower = selectedCity.toLowerCase();
      result = result.filter(
        (t) =>
          (t.city && t.city.toLowerCase().includes(cityLower)) ||
          t.location.toLowerCase().includes(cityLower) ||
          (t.address && t.address.toLowerCase().includes(cityLower))
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.sport && t.sport.toLowerCase().includes(q)) ||
          t.location.toLowerCase().includes(q) ||
          (t.address && t.address.toLowerCase().includes(q))
      );
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => Number(a.price_per_hour) - Number(b.price_per_hour));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => Number(b.price_per_hour) - Number(a.price_per_hour));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return result;
  }, [selectedCategory, selectedCity, searchQuery, sortBy, turfs]);

  return (
    <div className="turfs-page-container">
      {/* TOAST & QUICK VIEW MODAL */}
      <Toast message={toastMsg} onClose={() => setToastMsg("")} />
      {quickViewTurf && (
        <TurfQuickViewModal
          turf={quickViewTurf}
          onClose={() => setQuickViewTurf(null)}
        />
      )}

      {/* PAGE HEADER */}
      <div className="turfs-header-banner">
        <span className="banner-mini-tag">🏆 Premier Turf Directory</span>
        <h1>Explore Verified Outside-World Arenas</h1>
        <p>Book authentic floodlit venues across Football, Box Cricket, Badminton, Basketball, and Tennis</p>

        {/* SEARCH BAR */}
        <div className="turfs-search-box">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="search-box-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by turf name, location (e.g. Gachibowli, Koramangala) or sport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY SELECTOR */}
      <CategorySelector
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* CITY FILTER CHIPS & SORT BAR */}
      <div className="turfs-filters-bar">
        <div className="city-chips-group">
          <span className="filter-group-label">City:</span>
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`city-pill-btn ${selectedCity === c ? "active" : ""}`}
              onClick={() => setSelectedCity(c)}
            >
              {c === "All" ? "All Cities" : c}
            </button>
          ))}
        </div>

        <div className="sort-box">
          <span className="sort-label-text">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="turfs-sort-dropdown"
          >
            <option value="popular">Most Popular ⭐</option>
            <option value="rating">Top Rated 🔥</option>
            <option value="price_asc">Price: Low to High 💰</option>
            <option value="price_desc">Price: High to Low 💎</option>
          </select>
        </div>
      </div>

      {/* RESULT METRICS */}
      <div className="results-count-bar">
        <span>Showing <strong>{filteredTurfs.length}</strong> verified sports venues</span>
        {(selectedCategory || searchQuery || selectedCity !== "All") && (
          <button
            type="button"
            className="clear-all-filters-btn"
            onClick={() => {
              setSelectedCategory("");
              setSelectedCity("All");
              setSearchQuery("");
              setSortBy("popular");
            }}
          >
            Clear All Filters ✕
          </button>
        )}
      </div>

      {/* TURFS GRID */}
      {loading ? (
        <div className="turfs-cards-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="skeleton"
              style={{ height: "360px", borderRadius: "20px" }}
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : filteredTurfs.length === 0 ? (
        <div className="no-turfs-placeholder">
          <span className="placeholder-emoji">🏟️</span>
          <h3>No turfs match your criteria</h3>
          <p>Try resetting the city or category filter to discover all our verified grounds.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
              setSelectedCity("All");
              setSearchQuery("");
            }}
            className="btn-primary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="turfs-cards-grid">
          {filteredTurfs.map((turf) => (
            <TurfCard
              key={turf.id}
              turf={turf}
              onSelectForPreview={(t) => {
                setQuickViewTurf(t);
                setToastMsg(`Opening quick preview for ${t.name}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Turfs;