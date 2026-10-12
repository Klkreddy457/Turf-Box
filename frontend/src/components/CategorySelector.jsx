import "./CategorySelector.css";

const CATEGORIES = [
  { id: "all", name: "All Sports", icon: "🏆" },
  { id: "football", name: "Football", icon: "⚽" },
  { id: "cricket", name: "Cricket", icon: "🏏" },
  { id: "badminton", name: "Badminton", icon: "🏸" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
  { id: "more", name: "More", icon: "•••" },
];

function CategorySelector({ selectedCategory, onSelectCategory }) {
  return (
    <div className="categories-container">
      <h2 className="categories-title">Turf Categories</h2>
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
              <span className="category-name-text">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategorySelector;
