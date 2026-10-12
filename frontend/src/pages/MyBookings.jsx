import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyBookings,
  cancelBooking,
  createPaymentOrder,
  verifyPayment,
} from "../services/api";
import "./MyBookings.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | UPCOMING | COMPLETED | CANCELLED
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUserBookings() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMyBookings();
        if (isMounted) setBookings(data);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load bookings");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserBookings();
    return () => { isMounted = false; };
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      setCancelLoadingId(bookingId);
      const updated = await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status || "CANCELLED" } : b))
      );
    } catch (err) {
      alert(err.message || "Failed to cancel booking");
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handlePayNow = async (booking) => {
    try {
      const orderData = await createPaymentOrder(booking.id);
      openRazorpay(orderData, booking.id);
    } catch (err) {
      alert(err.message || "Failed to initiate payment");
    }
  };

  const openRazorpay = (paymentData, bookingId) => {
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded.");
      return;
    }

    const options = {
      key: paymentData.key_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: "TurfBox",
      description: `Payment for Booking #${bookingId}`,
      order_id: paymentData.order_id,
      handler: async function (response) {
        try {
          const verifyRes = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId
                ? { ...b, status: verifyRes.booking_status || "CONFIRMED" }
                : b
            )
          );
          alert("Payment verified! Booking confirmed.");
        } catch (err) {
          alert(err.message || "Payment verification failed");
        }
      },
      theme: { color: "#16a34a" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Filter bookings based on activeTab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "UPCOMING") return b.status === "CONFIRMED" || b.status === "PENDING";
    if (activeTab === "COMPLETED") return b.status === "COMPLETED";
    if (activeTab === "CANCELLED") return b.status === "CANCELLED";
    return true; // ALL
  });

  return (
    <div className="my-bookings-container">
      {/* PAGE HEADER */}
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <p>View and manage all your upcoming & past turf reservations</p>
      </div>

      {/* FILTER TABS */}
      <div className="bookings-tabs-bar">
        {["ALL", "UPCOMING", "COMPLETED", "CANCELLED"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* BOOKINGS LIST */}
      {loading ? (
        <div className="bookings-list">
          {[1, 2].map((n) => (
            <div key={n} className="skeleton" style={{ height: "160px", borderRadius: "20px" }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-bookings-card">
          <p>No bookings found in this category.</p>
          <Link to="/turfs" className="btn-primary">
            Book a Turf Now
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((b) => {
            const formatTime = (t) => (t ? t.substring(0, 5) : "");
            return (
              <div key={b.id} className="booking-card-item">
                <div className="booking-card-left">
                  <div className="booking-ref-badge">Ref #{b.id}</div>
                  <h3 className="booking-turf-title">Turf Reservation #{b.id}</h3>
                  <div className="booking-meta-row">
                    <span>📅 {b.booking_date}</span>
                    <span>
                      ⏰ {formatTime(b.start_time)} - {formatTime(b.end_time)}
                    </span>
                    <span>💰 ₹{Number(b.total_amount).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="booking-card-right">
                  {/* STATUS PILL */}
                  <span className={`status-pill ${b.status.toLowerCase()}`}>
                    {b.status}
                  </span>

                  {/* ACTIONS */}
                  <div className="booking-card-actions">
                    {b.status === "PENDING" && (
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        onClick={() => handlePayNow(b)}
                      >
                        Pay Now
                      </button>
                    )}

                    {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                      <button
                        type="button"
                        disabled={cancelLoadingId === b.id}
                        className="btn-outline text-xs cancel-btn"
                        onClick={() => handleCancel(b.id)}
                      >
                        {cancelLoadingId === b.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}

                    <Link to={`/turfs/${b.turf_id || 1}`} className="btn-outline text-xs">
                      View Turf
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;