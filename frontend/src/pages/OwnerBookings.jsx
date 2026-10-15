import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api.js";

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/owner/bookings/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();

      setBookings(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

async function updateBookingStatus(bookingId, status) {
    try {
        setActionLoading(bookingId);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_BASE_URL}/owner/bookings/${bookingId}/status/`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    status: status,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                "Failed to update booking"
            );
        }

        setBookings((currentBookings) =>
            currentBookings.map((booking) =>
                booking.id === bookingId
                    ? data
                    : booking
            )
        );

    } catch (error) {
            setError(error.message);
    } finally {
            setActionLoading(null);
    }
}

  if (loading) {
    return <h2>Loading bookings...</h2>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <main>
      <h1>Owner Bookings</h1>

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id}>
            <p>
              Date: {booking.booking_date}
            </p>

            <p>
              Time: {booking.start_time} - {booking.end_time}
            </p>

            <p>
              Status: {booking.status}
            </p>

            <p>
              Amount: ₹{booking.total_amount}
            </p>

            {booking.status === "PENDING" && (
                <div>

                    <button
                        type="button"
                        onClick={() =>
                            updateBookingStatus(
                                booking.id,
                                "CONFIRMED"
                            )
                        }
                        disabled={actionLoading === booking.id}
                    >
                        {actionLoading === booking.id
                            ? "Updating..."
                            : "Confirm"}
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            updateBookingStatus(
                                booking.id,
                                "CANCELLED"
                            )
                        }
                        disabled={actionLoading === booking.id}
                    >
                        {actionLoading === booking.id
                            ? "Updating..."
                            : "Reject"}
                    </button>

                </div>
            )}
          </div>
        ))
      )}
    </main>
  );
}

export default OwnerBookings;