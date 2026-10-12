import { useEffect, useState, useMemo } from "react";
import TurfCard from "../components/TurfCard";
import CategorySelector from "../components/CategorySelector";
import TurfQuickViewModal from "../components/TurfQuickViewModal";
import Toast from "../components/Toast";
import { fetchTurfs } from "../services/api";
import "./Turfs.css";

function Turfs() {
  const [turfs, setTurfs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
        <h1>Explore Available Turfs</h1>
        <p>Book your favorite ground for football, cricket, badminton and more</p>

        {/* SEARCH BAR */}
        <div className="turfs-search-box">
          <input
            type="text"
            placeholder="Search by turf name, location, or sport..."
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

      {/* RESULT METRICS */}
      <div className="results-count-bar">
        <span>Showing {filteredTurfs.length} turfs</span>
        {(selectedCategory || searchQuery) && (
          <button
            type="button"
            className="btn-outline text-xs"
            onClick={() => {
              setSelectedCategory("");
              setSearchQuery("");
            }}
          >
            Clear Filters
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
              style={{ height: "340px", borderRadius: "20px" }}
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : filteredTurfs.length === 0 ? (
        <div className="no-turfs-placeholder">
          <p>No turfs found matching your search criteria.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
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