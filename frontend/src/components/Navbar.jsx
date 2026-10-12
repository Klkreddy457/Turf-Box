import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(
    () => localStorage.getItem("turfbox_city") || "Hyderabad"
  );

  const user = useMemo(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  function handleCityChange(city) {
    setSelectedLocation(city);
    localStorage.setItem("turfbox_city", city);
    window.dispatchEvent(new CustomEvent("city_changed", { detail: city }));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  }

  return (
    <header className="navbar-container">
      <div className="navbar-wrapper">
        {/* BRAND LOGO */}
        <Link to="/" className="brand-logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" fill="#22c55e" stroke="none" />
              <path d="M12 6v12M6 12h12" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
          <div className="logo-text-group">
            <span className="logo-title">
              Turf<span className="text-green">Box</span>
            </span>
            <span className="logo-tagline">Outside-World Arenas</span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="nav-menu">
          <Link
            to="/"
            className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          >
            Home
          </Link>
          <Link
            to="/turfs"
            className={`nav-item ${location.pathname === "/turfs" ? "active" : ""}`}
          >
            All Turfs
          </Link>
          {user && (
            <Link
              to="/my-bookings"
              className={`nav-item ${location.pathname === "/my-bookings" ? "active" : ""}`}
            >
              My Bookings
            </Link>
          )}
          {user?.role === "owner" && (
            <Link
              to="/owner/dashboard"
              className={`nav-item owner-nav-highlight ${location.pathname.startsWith("/owner") ? "active" : ""}`}
            >
              👑 Owner Portal
            </Link>
          )}
        </nav>

        {/* CONTROLS & AUTH */}
        <div className="nav-actions">
          {/* LOCATION SELECTOR */}
          <div className="location-pill" title="Select City">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="location-icon">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <select
              value={selectedLocation}
              onChange={(e) => handleCityChange(e.target.value)}
              className="location-select"
            >
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi NCR</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
            </select>
          </div>

          {/* SEARCH BUTTON ICON */}
          <button
            className="search-btn-circle"
            title="Search turfs"
            onClick={() => navigate("/turfs")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* USER AVATAR / PROFILE */}
          {user ? (
            <div className="user-profile-menu">
              <div className="avatar-circle">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.email}`}
                  alt="User Avatar"
                />
              </div>
              <div className="user-details-col">
                <span className="user-name">{user.name?.split(" ")[0] || "Player"}</span>
                <span className="user-role-badge">{user.role || "Member"}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn" title="Logout">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="auth-btn-group">
              <Link to="/login" className="btn-secondary nav-login-btn">
                Log In
              </Link>
              <Link to="/register" className="btn-primary nav-register-btn">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavBar;