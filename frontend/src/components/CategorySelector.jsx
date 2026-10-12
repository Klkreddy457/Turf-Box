import "./CategorySelector.css";

const CATEGORIES = [
  { id: "all", name: "All Sports", icon: "🏆", tag: "All" },
  { id: "football", name: "Football", icon: "⚽", tag: "FIFA Turf" },
  { id: "cricket", name: "Cricket", icon: "🏏", tag: "Box Pitch" },
  { id: "badminton", name: "Badminton", icon: "🏸", tag: "BWF Indoor" },
  { id: "basketball", name: "Basketball", icon: "🏀", tag: "Hardwood" },
  { id: "tennis", name: "Tennis", icon: "🎾", tag: "ITF Court" },
  { id: "futsal", name: "Futsal", icon: "🥅", tag: "Fast 5v5" },
  { id: "volleyball", name: "Volleyball", icon: "🏐", tag: "Beach/Court" },
  { id: "pickleball", name: "Pickleball", icon: "🏓", tag: "USAPA" },
];

function CategorySelector({ selectedCategory, onSelectCategory }) {
  return (
    <div className="categories-container">
      <div className="categories-header-row">
        <div>
          <h2 className="categories-title">Explore by Sport</h2>
          <p className="categories-sub">Choose your sport to filter top-rated turfs with verified outside-world images</p>
        </div>
      </div>
      <div className="categories-scroll-wrapper">
        <div className="categories-grid">
          {CATEGORIES.map((cat) => {
            const isSelected =
              selectedCategory?.toLowerCase() === cat.id ||
              (cat.id === "all" && !selectedCategory);
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-pill-card ${isSelected ? "active" : ""}`}
                onClick={() => onSelectCategory(cat.id === "all" ? "" : cat.name)}
              >
                <span className="category-icon-wrapper">{cat.icon}</span>
                <div className="category-info-col">
                  <span className="category-name-text">{cat.name}</span>
                  <span className="category-tag-badge">{cat.tag}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CategorySelector;
