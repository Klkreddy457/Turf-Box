import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTurfAvailability, getMediaUrl } from "../services/api";
import { extractFacilities } from "../utils/facilities";
import "./BookingPanel.css";

const DURATION_OPTIONS = [
  { label: "30 Min", value: 30 },
  { label: "1 Hour", value: 60 },
  { label: "1.5 Hours", value: 90 },
  { label: "2 Hours", value: 120 },
  { label: "2.5 Hours", value: 150 },
  { label: "3 Hours", value: 180 },
];

function BookingPanel({ turf }) {
  const navigate = useNavigate();

  // Date calculation & dates generator (7 upcoming days)
  const getUpcomingDates = () => {
    const dates = [];
    const baseDate = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(baseDate.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const isoDate = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthYear = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      dates.push({
        isoDate,
        dayName,
        dayNum,
        monthYear,
      });
    }
    return dates;
  };

  const availableDates = getUpcomingDates();
  const [selectedDateObj, setSelectedDateObj] = useState(availableDates[0]);
  const [duration, setDuration] = useState(60); // Default 60 mins (1 hour fixed base)
  const [activePeriod, setActivePeriod] = useState("All"); // All | Morning | Afternoon | Night
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Django API availability when turf or date changes
  useEffect(() => {
    if (!turf || !turf.id || !selectedDateObj.isoDate) return;
    let isMounted = true;

    async function loadAvailability() {
      try {
        setLoading(true);
        setError("");
        setSelectedSlot(null);
        const data = await fetchTurfAvailability(turf.id, selectedDateObj.isoDate);
        if (isMounted) setSlots(data.slots || []);
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load slots");
          setSlots([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAvailability();
    return () => {
      isMounted = false;
    };
  }, [turf, selectedDateObj]);

  // Helper: Check if a slot is in the past for the selected date
  const isSlotInPast = (slot) => {
    if (slot.is_past) return true;
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (selectedDateObj?.isoDate === todayLocal) {
      const [h, m] = slot.start_time.split(":").map(Number);
      const slotStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      return slotStartTime <= now;
    }
    return false;
  };

  // Helper: Check if slot + duration exceeds turf closing time
  const doesSlotExceedClosing = (slot, durationMins) => {
    if (!turf?.closing_time) return false;
    const [h, m] = slot.start_time.split(":").map(Number);
    const endMinutes = h * 60 + m + durationMins;
    const [closeH, closeM] = turf.closing_time.split(":").map(Number);
    const closeMinutes = closeH * 60 + closeM;
    return endMinutes > closeMinutes;
  };

  // Check if N consecutive 30-min slots from startSlot are available for duration
  const checkConsecutiveAvailability = (startSlot, durationMinutes) => {
    const startIndex = slots.findIndex((s) => s.start_time === startSlot.start_time);
    if (startIndex === -1) return false;
    const requiredSlotCount = Math.ceil(durationMinutes / 30);

    for (let i = 0; i < requiredSlotCount; i++) {
      const targetSlot = slots[startIndex + i];
      if (!targetSlot || !targetSlot.available) {
        return false;
      }
    }
    return true;
  };

  // Check if a slot falls within the selected block
  const isSlotInSelectedBlock = (slot) => {
    if (!selectedSlot) return false;
    const startIndex = slots.findIndex((s) => s.start_time === selectedSlot.start_time);
    const currentIndex = slots.findIndex((s) => s.start_time === slot.start_time);
    if (startIndex === -1 || currentIndex === -1) return false;
    const requiredSlotCount = Math.ceil(duration / 30);
    return currentIndex >= startIndex && currentIndex < startIndex + requiredSlotCount;
  };

  // Calculate end time string from start time and duration
  const calculateEndTimeStr = (startTimeStr, durationMins) => {
    if (!startTimeStr) return "";
    const [h, m] = startTimeStr.split(":").map(Number);
    const totalM = h * 60 + m + durationMins;
    const endH = Math.floor(totalM / 60);
    const endM = totalM % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;
  };

  // Filter slots:
  // 1. Completely remove slots that have already passed today
  // 2. Completely remove slots near closing time that cannot fit the selected duration
  // 3. Filter by active period tab (All, Morning, Afternoon, Night)
  const filterVisibleSlots = (slotList, period, selectedDuration) => {
    return slotList.filter((slot) => {
      // Past slots disappear
      if (isSlotInPast(slot)) return false;

      // Slots exceeding closing time disappear
      if (doesSlotExceedClosing(slot, selectedDuration)) return false;

      // Non-booked slots that do not have enough consecutive availability disappear
      if (!slot.is_booked && !checkConsecutiveAvailability(slot, selectedDuration)) return false;

      // Period tab filter
      if (period !== "All") {
        const startHour = parseInt(slot.start_time.split(":")[0], 10);
        if (period === "Morning" && startHour >= 12) return false;
        if (period === "Afternoon" && (startHour < 12 || startHour >= 17)) return false;
        if (period === "Night" && startHour < 17) return false;
      }

      return true;
    });
  };

  const currentPeriodSlots = filterVisibleSlots(slots, activePeriod, duration);

  // Format 24h string "10:30:00" to "10:30"
  const formatTimeStr = (timeStr) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  const handleSlotClick = (slot) => {
    if (!slot.available) return;
    const canBook = checkConsecutiveAvailability(slot, duration);
    if (!canBook) {
      setError(`Not enough consecutive slots available for ${duration} minutes.`);
      setSelectedSlot(null);
      return;
    }

    if (selectedSlot?.start_time === slot.start_time) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
      setError("");
    }
  };

  const handleDurationSelect = (durValue) => {
    setDuration(durValue);
    if (selectedSlot) {
      const exceeds = doesSlotExceedClosing(selectedSlot, durValue);
      const canBook = checkConsecutiveAvailability(selectedSlot, durValue);
      if (exceeds || !canBook) {
        setSelectedSlot(null);
        setError("");
      } else {
        setError("");
      }
    }
  };

  const handleReset = () => {
    setSelectedSlot(null);
    setError("");
  };

  const handleContinue = () => {
    if (!selectedSlot) return;
    const endTimeStr = calculateEndTimeStr(selectedSlot.start_time, duration);
    navigate(`/booking/${turf.id}`, {
      state: {
        selectedDate: selectedDateObj.isoDate,
        selectedSlot: {
          ...selectedSlot,
          end_time: endTimeStr,
        },
        duration: duration,
      },
    });
  };

  if (!turf) {
    return (
      <div className="booking-panel-card loading-state">
        <p>Select a turf to view details & book slots.</p>
      </div>
    );
  }

  const DEFAULT_PANEL_HERO =
    "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80";

  const rawPanelImage =
    turf.images && turf.images.length > 0
      ? turf.images[0].image_url || turf.images[0].image
      : null;

  const mainImage = rawPanelImage ? getMediaUrl(rawPanelImage) : DEFAULT_PANEL_HERO;

  // Optional facilities added by owner
  const facilities = extractFacilities(turf);

  // Price calculation based on duration
  const basePricePerHour = Number(turf.price_per_hour || 2000);
  const totalPrice = Math.round((basePricePerHour / 60) * duration);

  return (
    <aside className="booking-panel-card">
      {/* FEATURED TURF IMAGE */}
      <div className="panel-featured-image">
        <img
          src={mainImage}
          alt={turf.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_PANEL_HERO;
          }}
        />
        <div className="image-overlay-actions">
          <button className="view-photos-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            View Photos
          </button>
          <div className="top-right-icons">
            <button className="icon-circle-btn">♡</button>
            <button className="icon-circle-btn">↗</button>
          </div>
        </div>
      </div>

      <div className="panel-content-body">
        {/* TURF TITLE & RATING */}
        <div className="panel-header-row">
          <h2 className="panel-turf-name">{turf.name}</h2>
          <div className="badge-rating text-sm">
            <span>⭐</span> {turf.rating || "4.8"} <span className="review-count">(120+ reviews)</span>
          </div>
        </div>

        {/* LOCATION & ADDRESS */}
        <p className="panel-address">
          📍 {turf.address || turf.location || "Plot 12, Road 5, Dhanmondi, Hyderabad"}
        </p>

        {/* FIXED 1 HOUR BASE PRICE DISPLAY */}
        <p className="panel-price">
          <strong>₹{basePricePerHour.toLocaleString("en-IN")}</strong>
          <span> / 1 hour</span>
        </p>

        {/* FIXED OPERATING HOURS BADGE */}
        {turf.opening_time && turf.closing_time && (
          <div className="panel-hours-badge">
            <span>⏰</span>
            <span>
              Operating Hours: <strong>{formatTimeStr(turf.opening_time)}</strong> to{" "}
              <strong>{formatTimeStr(turf.closing_time)}</strong>
            </span>
          </div>
        )}

        {/* ABOUT */}
        {turf.description && (
          <div className="panel-about-section">
            <h3>About</h3>
            <p>{turf.description}</p>
          </div>
        )}

        {/* FACILITIES ICONS */}
        {facilities.length > 0 && (
          <div className="panel-facilities-grid">
            {facilities.map((fac, idx) => (
              <div key={idx} className="facility-icon-item">
                <span className="fac-emoji">{fac.icon || "⚡"}</span>
                <small>{fac.name || fac}</small>
              </div>
            ))}
          </div>
        )}

        {/* DURATION SELECTOR PILLS */}
        <div className="panel-section-header">
          <h3>Select Playing Duration</h3>
          <span className="current-month-text">{duration} Mins</span>
        </div>

        <div className="duration-pills-row">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`duration-pill-btn ${duration === opt.value ? "active" : ""}`}
              onClick={() => handleDurationSelect(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* DATE SELECTOR */}
        <div className="panel-section-header margin-top-md">
          <h3>Select Date</h3>
          <span className="current-month-text">{selectedDateObj.monthYear}</span>
        </div>

        <div className="date-pill-carousel">
          {availableDates.map((item) => {
            const isSelected = item.isoDate === selectedDateObj.isoDate;
            return (
              <button
                key={item.isoDate}
                type="button"
                className={`date-pill ${isSelected ? "selected-date-pill" : ""}`}
                onClick={() => setSelectedDateObj(item)}
              >
                <span className="day-name">{item.dayName}</span>
                <strong className="day-num">{item.dayNum}</strong>
              </button>
            );
          })}
        </div>

        {/* TIME SLOT SELECTOR */}
        <div className="panel-section-header margin-top-lg">
          <div>
            <h3>Pick Start Time ({duration} mins block)</h3>
            <p className="slots-timing-note">
              Slots only from <strong>{formatTimeStr(turf.opening_time)}</strong> to{" "}
              <strong>{formatTimeStr(turf.closing_time)}</strong>
            </p>
          </div>
          <button type="button" className="reset-link-btn" onClick={handleReset}>
            ↻ Reset
          </button>
        </div>

        {/* PERIOD TABS */}
        <div className="period-tabs-group">
          {["All", "Morning", "Afternoon", "Night"].map((period) => (
            <button
              key={period}
              type="button"
              className={`period-tab-btn ${activePeriod === period ? "active-tab" : ""}`}
              onClick={() => setActivePeriod(period)}
            >
              {period === "All" && "🕒 "}
              {period === "Morning" && "🌤 "}
              {period === "Afternoon" && "☀️ "}
              {period === "Night" && "🌙 "}
              {period}
            </button>
          ))}
        </div>

        {/* SLOTS GRID */}
        {loading ? (
          <div className="slots-loading-box">
            <div className="skeleton" style={{ height: "40px", borderRadius: "10px" }}></div>
            <div className="skeleton" style={{ height: "40px", borderRadius: "10px" }}></div>
            <div className="skeleton" style={{ height: "40px", borderRadius: "10px" }}></div>
          </div>
        ) : error ? (
          <div className="slots-error-box">{error}</div>
        ) : currentPeriodSlots.length === 0 ? (
          <p className="no-slots-msg">
            No upcoming slots available for this period today. Please check other periods or upcoming dates.
          </p>
        ) : (
          <div className="time-slots-grid">
            {currentPeriodSlots.map((slot) => {
              const isSelectedBlock = isSlotInSelectedBlock(slot);
              const isBooked = slot.is_booked;
              const hasEnoughSlots = checkConsecutiveAvailability(slot, duration);
              const isSlotDisabled = !slot.available || !hasEnoughSlots;

              let slotClass = "slot-btn available";
              if (isSlotDisabled) slotClass = "slot-btn booked";
              if (isSelectedBlock) slotClass = "slot-btn selected";

              return (
                <button
                  key={slot.start_time}
                  type="button"
                  disabled={isSlotDisabled}
                  className={slotClass}
                  onClick={() => handleSlotClick(slot)}
                >
                  <span className="slot-time-text">
                    {formatTimeStr(slot.start_time)} - {formatTimeStr(slot.end_time)}
                  </span>
                  {isSelectedBlock && <span className="slot-status-pill">Selected</span>}
                  {isBooked && <span className="slot-status-pill booked-text">Booked</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* SELECTED SLOT SUMMARY BAR WITH TOTAL FOR SELECTED DURATION */}
        {selectedSlot && (
          <div className="selected-block-info-card">
            <span>
              📅 {selectedDateObj.isoDate} | ⏰ {formatTimeStr(selectedSlot.start_time)} to{" "}
              {formatTimeStr(calculateEndTimeStr(selectedSlot.start_time, duration))} ({duration} mins)
              <br />
              <strong>Total: ₹{totalPrice.toLocaleString("en-IN")}</strong>
            </span>
          </div>
        )}

        {/* CONTINUE TO BOOKING BUTTON */}
        <button
          type="button"
          disabled={!selectedSlot}
          className="continue-booking-action-btn"
          onClick={handleContinue}
        >
          <span>Continue to Booking</span>
          <span>→</span>
        </button>
      </div>
    </aside>
  );
}

export default BookingPanel;
