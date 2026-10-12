import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function OwnerDashboard() {

    const [dashboard, setDashboard] = useState(null);
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {

        try {

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please login first.");
            }

            const headers = {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
            };

            const dashboardResponse = await fetch(
                "http://127.0.0.1:8000/api/owner/dashboard/",
                {
                    method: "GET",
                    headers,
                }
            );

            const dashboardData = await dashboardResponse.json();

            if (!dashboardResponse.ok) {
                throw new Error(
                    dashboardData.error ||
                    dashboardData.detail ||
                    "Failed to load dashboard"
                );
            }

            setDashboard(dashboardData);

            const bookingsResponse = await fetch(
                "http://127.0.0.1:8000/api/owner/bookings/",
                {
                    method: "GET",
                    headers,
                }
            );

            const bookingsData = await bookingsResponse.json();

            if (!bookingsResponse.ok) {
                throw new Error(
                    bookingsData.error ||
                    bookingsData.detail ||
                    "Failed to load bookings"
                );
            }

            setBookings(bookingsData);

        } catch (error) {

            console.error(error);
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
                `http://127.0.0.1:8000/api/owner/bookings/${bookingId}/status/`,
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
                    data.error ||
                    data.detail ||
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

            await loadDashboard();

        } catch (error) {

            console.error(error);
            setError(error.message);

        } finally {

            setActionLoading(null);

        }
    }

    if (loading) {
        return (
            <main>
                <h1>Owner Dashboard</h1>
                <p>Loading dashboard...</p>
            </main>
        );
    }

    if (error && !dashboard) {
        return (
            <main>
                <h1>Owner Dashboard</h1>
                <p>{error}</p>
            </main>
        );
    }

    const pendingBookings = bookings.filter(
        (booking) => booking.status === "PENDING"
    );

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const todayBookings = bookings.filter(
        (booking) =>
            booking.booking_date === today
    );

    return (
        <main>

            <h1>Owner Dashboard</h1>

            {error && (
                <p>{error}</p>
            )}

            {/* Statistics */}

            <section>

                <div>
                    <h2>Total Turfs</h2>
                    <p>{dashboard.total_turfs}</p>
                </div>

                <div>
                    <h2>Active Turfs</h2>
                    <p>{dashboard.active_turfs}</p>
                </div>

                <div>
                    <h2>Total Bookings</h2>
                    <p>{dashboard.total_bookings}</p>
                </div>

                <div>
                    <h2>Pending</h2>
                    <p>{dashboard.pending_bookings}</p>
                </div>

                <div>
                    <h2>Confirmed</h2>
                    <p>{dashboard.confirmed_bookings}</p>
                </div>

                <div>
                    <h2>Completed</h2>
                    <p>{dashboard.completed_bookings}</p>
                </div>

                <div>
                    <h2>Cancelled</h2>
                    <p>{dashboard.cancelled_bookings}</p>
                </div>

                <div>
                    <h2>Revenue</h2>
                    <p>
                        ₹{dashboard.total_revenue}
                    </p>
                </div>

            </section>

            {/* Pending Bookings */}

            <section>

                <h2>Pending Bookings</h2>

                {pendingBookings.length === 0 ? (

                    <p>
                        No pending bookings.
                    </p>

                ) : (

                    pendingBookings.map((booking) => (

                        <div key={booking.id}>

                            <p>
                                Date: {booking.booking_date}
                            </p>

                            <p>
                                Time: {booking.start_time}
                                {" - "}
                                {booking.end_time}
                            </p>

                            <p>
                                Amount: ₹{booking.total_amount}
                            </p>

                            <p>
                                Status: {booking.status}
                            </p>

                            <button
                                type="button"
                                disabled={
                                    actionLoading === booking.id
                                }
                                onClick={() =>
                                    updateBookingStatus(
                                        booking.id,
                                        "CONFIRMED"
                                    )
                                }
                            >
                                {actionLoading === booking.id
                                    ? "Updating..."
                                    : "Confirm"}
                            </button>

                            <button
                                type="button"
                                disabled={
                                    actionLoading === booking.id
                                }
                                onClick={() =>
                                    updateBookingStatus(
                                        booking.id,
                                        "CANCELLED"
                                    )
                                }
                            >
                                Reject
                            </button>

                        </div>

                    ))

                )}

            </section>

            {/* Today's Bookings */}

            <section>

                <h2>Today's Bookings</h2>

                {todayBookings.length === 0 ? (

                    <p>
                        No bookings for today.
                    </p>

                ) : (

                    todayBookings.map((booking) => (

                        <div key={booking.id}>

                            <p>
                                Time: {booking.start_time}
                                {" - "}
                                {booking.end_time}
                            </p>

                            <p>
                                Amount: ₹{booking.total_amount}
                            </p>

                            <p>
                                Status: {booking.status}
                            </p>

                        </div>

                    ))

                )}

            </section>

            {/* Quick Actions */}

            <section>

                <h2>Quick Actions</h2>

                <p>
                    <Link to="/owner/turfs">
                        Manage Turfs
                    </Link>
                </p>

                <p>
                    <Link to="/owner/turfs/create">
                        Create Turf
                    </Link>
                </p>

                <p>
                    <Link to="/owner/bookings">
                        View All Bookings
                    </Link>
                </p>

            </section>

        </main>
    );
}

export default OwnerDashboard;