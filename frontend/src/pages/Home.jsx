import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import CategorySelector from "../components/CategorySelector";
import TurfCard from "../components/TurfCard";
import TurfQuickViewModal from "../components/TurfQuickViewModal";
import Toast from "../components/Toast";
import { fetchTurfs } from "../services/api";
import "./Home.css";

const CITIES = ["All", "Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Chennai"];

function Home() {
  const [turfs, setTurfs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [quickViewTurf, setQuickViewTurf] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load initial turfs
  useEffect(() => {
    async function loadTurfsData() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTurfs();
        setTurfs(data);
        if (data && data.length > 0) {
          setSelectedTurf(data[0]);
        }
      } catch (err) {
        setError(err.message || "Failed to load turfs");
      } finally {
        setLoading(false);
      }
    }

    loadTurfsData();

    // Listen to navbar city change
    const onCityChange = (e) => {
      if (e.detail) {
        setSelectedCity(e.detail);
      }
    };
    window.addEventListener("city_changed", onCityChange);
    return () => window.removeEventListener("city_changed", onCityChange);
  }, []);

  // Compute filtered & sorted turfs
  const filteredTurfs = useMemo(() => {
    let result = [...turfs];

    // Filter by Category
    if (selectedCategory) {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter(
        (t) =>
          (t.sport && t.sport.toLowerCase().includes(catLower)) ||
          t.name.toLowerCase().includes(catLower) ||
          (t.description && t.description.toLowerCase().includes(catLower))
      );
    }

    // Filter by City
    if (selectedCity && selectedCity !== "All") {
      const cityLower = selectedCity.toLowerCase();
      result = result.filter(
        (t) =>
          (t.city && t.city.toLowerCase().includes(cityLower)) ||
          t.location.toLowerCase().includes(cityLower) ||
          (t.address && t.address.toLowerCase().includes(cityLower))
      );
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.sport && t.sport.toLowerCase().includes(q)) ||
          t.location.toLowerCase().includes(q) ||
          (t.address && t.address.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sorting
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
    <div className="home-layout-container">
      {/* TOAST NOTIFICATION */}
      <Toast message={toastMsg} onClose={() => setToastMsg("")} />

      {/* QUICK VIEW MODAL */}
      {quickViewTurf && (
        <TurfQuickViewModal
          turf={quickViewTurf}
          onClose={() => setQuickViewTurf(null)}
        />
      )}

      {/* LEFT COLUMN: HERO, CATEGORIES, POPULAR LIST */}
      <section className="home-main-content">
        {/* HERO SECTION */}
        <HeroSection
          onSearch={(query) => setSearchQuery(query)}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* CATEGORY SELECTOR */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={(catName) => setSelectedCategory(catName)}
        />

        {/* POPULAR TURFS SECTION HEADER & TOOLBAR */}
        <div className="popular-section-header">
          <div>
            <h2 className="section-title">Verified Outside-World Turfs</h2>
            <p className="section-subtitle">
              Showing {filteredTurfs.length} tournament-grade sports grounds
              {selectedCity !== "All" && ` in ${selectedCity}`}
              {selectedCategory && ` for ${selectedCategory}`}
            </p>
          </div>

          <div className="filters-toolbar">
            {/* SORT DROPDOWN */}
            <div className="sort-select-wrapper">
              <span className="sort-label">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-dropdown"
              >
                <option value="popular">Most Popular ⭐</option>
                <option value="rating">Top Rated 🔥</option>
                <option value="price_asc">Price: Low to High 💰</option>
                <option value="price_desc">Price: High to Low 💎</option>
              </select>
            </div>

            <Link to="/turfs" className="view-all-link">
              Explore All →
            </Link>
          </div>
        </div>

        {/* CITY CHIP FILTERS */}
        <div className="city-chips-filter-row">
          <span className="city-filter-label">Quick City Filter:</span>
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`city-filter-btn ${selectedCity === c ? "active" : ""}`}
              onClick={() => setSelectedCity(c)}
            >
              {c === "All" ? "All Locations" : c}
            </button>
          ))}
        </div>

        {/* TURF CARDS GRID */}
        {loading ? (
          <div className="turf-cards-grid">
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
          <div className="empty-turfs-box">
            <div className="empty-icon">🏟️</div>
            <h3>No turfs found for this criteria</h3>
            <p>Try resetting the city or category filter to explore all available venues.</p>
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedCity("All");
                setSearchQuery("");
                setSortBy("popular");
              }}
              className="btn-primary"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="turf-cards-grid">
            {filteredTurfs.map((turf) => (
              <TurfCard
                key={turf.id}
                turf={turf}
                isPreviewSelected={selectedTurf?.id === turf.id}
                onSelectForPreview={(t) => {
                  setSelectedTurf(t);
                  setQuickViewTurf(t);
                  setToastMsg(`Loaded instant preview for ${t.name}`);
                }}
              />
            ))}
          </div>
        )}

        {/* WHY TURFBOX TRUST SECTION */}
        <div className="trust-features-section">
          <h3 className="trust-main-heading">Why Athletes & Teams Choose TurfBox</h3>
          <div className="trust-features-grid">
            <div className="trust-card">
              <div className="trust-icon-box">🏟️</div>
              <h4>100% Real Venues</h4>
              <p>Every ground is inspected for genuine European grass, level bounce, and regulation dimensions.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon-box">⚡</div>
              <h4>Instant Slot Lock</h4>
              <p>Direct real-time integration with venue schedules. Zero double bookings or waiting.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon-box">💡</div>
              <h4>High-Intensity Floodlights</h4>
              <p>Guaranteed 250+ lux stadium illumination for night box cricket and football matches.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon-box">💳</div>
              <h4>Protected Payments</h4>
              <p>Instant UPI, Cards, and NetBanking checkout powered by Razorpay with automated invoices.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;