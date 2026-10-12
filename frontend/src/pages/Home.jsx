import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import CategorySelector from "../components/CategorySelector";
import TurfCard from "../components/TurfCard";
import BookingPanel from "../components/BookingPanel";
import TurfQuickViewModal from "../components/TurfQuickViewModal";
import Toast from "../components/Toast";
import { fetchTurfs } from "../services/api";
import "./Home.css";

function Home() {
  const [turfs, setTurfs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [quickViewTurf, setQuickViewTurf] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

  // Compute filtered turfs directly during render
  const filteredTurfs = useMemo(() => {
    let result = [...turfs];

    if (selectedCategory) {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(catLower) ||
          (t.description && t.description.toLowerCase().includes(catLower))
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          (t.address && t.address.toLowerCase().includes(q))
      );
    }

    return result;
  }, [selectedCategory, searchQuery, turfs]);

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
        <HeroSection onSearch={(query) => setSearchQuery(query)} />

        {/* CATEGORY SELECTOR */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={(catName) => setSelectedCategory(catName)}
        />

        {/* POPULAR TURFS SECTION */}
        <div className="popular-section-header">
          <div>
            <h2 className="section-title">Popular Turfs Near You</h2>
            <p className="section-subtitle">
              {filteredTurfs.length} top-rated turfs available in your area
            </p>
          </div>
          <Link to="/turfs" className="view-all-link">
            View All →
          </Link>
        </div>

        {/* TURF CARDS GRID */}
        {loading ? (
          <div className="turf-cards-grid">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="skeleton"
                style={{ height: "320px", borderRadius: "20px" }}
              ></div>
            ))}
          </div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : filteredTurfs.length === 0 ? (
          <div className="empty-turfs-box">
            <p>No turfs match your search or filter.</p>
            <button
              onClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className="btn-outline"
            >
              Reset Filters
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
                  setToastMsg(`Loaded preview for ${t.name}`);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* RIGHT COLUMN: FEATURED TURF BOOKING PANEL */}
      <aside className="home-side-panel">
        <BookingPanel turf={selectedTurf} />
      </aside>
    </div>
  );
}

export default Home;