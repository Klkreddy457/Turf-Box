import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top-grid">
          {/* BRAND COLUMN */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" fill="#22c55e" stroke="none" />
                  <path d="M12 6v12M6 12h12" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
              <span className="footer-logo-title">
                Turf<span className="text-green">Box</span>
              </span>
            </div>
            <p className="footer-desc">
              India's premier sports venue reservation platform. Discover and book real-world Football, Box Cricket, Badminton, Basketball, and Tennis turfs instantly.
            </p>
            <div className="footer-social-row">
              <span className="social-pill">⚽ Football</span>
              <span className="social-pill">🏏 Cricket</span>
              <span className="social-pill">🏸 Badminton</span>
              <span className="social-pill">🏀 Basketball</span>
              <span className="social-pill">🎾 Tennis</span>
            </div>
          </div>

          {/* SPORTS LINKS */}
          <div className="footer-col">
            <h4 className="footer-col-title">Sports Categories</h4>
            <ul className="footer-links-list">
              <li><Link to="/turfs?sport=Football">FIFA Football Turfs</Link></li>
              <li><Link to="/turfs?sport=Cricket">Box Cricket Arenas</Link></li>
              <li><Link to="/turfs?sport=Badminton">BWF Badminton Courts</Link></li>
              <li><Link to="/turfs?sport=Basketball">Hardwood Basketball</Link></li>
              <li><Link to="/turfs?sport=Tennis">ITF Tennis Courts</Link></li>
              <li><Link to="/turfs?sport=Futsal">Indoor Futsal 5v5</Link></li>
            </ul>
          </div>

          {/* TOP CITIES */}
          <div className="footer-col">
            <h4 className="footer-col-title">Top Sports Cities</h4>
            <ul className="footer-links-list">
              <li><Link to="/turfs?location=Hyderabad">Turfs in Hyderabad</Link></li>
              <li><Link to="/turfs?location=Bengaluru">Turfs in Bengaluru</Link></li>
              <li><Link to="/turfs?location=Mumbai">Turfs in Mumbai</Link></li>
              <li><Link to="/turfs?location=Delhi">Turfs in Delhi NCR</Link></li>
              <li><Link to="/turfs?location=Chennai">Turfs in Chennai</Link></li>
              <li><Link to="/turfs?location=Pune">Turfs in Pune</Link></li>
            </ul>
          </div>

          {/* CONTACT & SECURITY */}
          <div className="footer-col">
            <h4 className="footer-col-title">Support & Trust</h4>
            <ul className="footer-links-list">
              <li><span className="trust-badge">🛡️ 100% Verified Venues</span></li>
              <li><span className="trust-badge">⚡ Instant Razorpay UPI/Cards</span></li>
              <li><span className="trust-badge">🕒 24/7 Ground Assistance</span></li>
              <li><a href="mailto:support@turfbox.com">support@turfbox.com</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} TurfBox Technologies Inc. All rights reserved.</p>
          <div className="footer-legal-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
