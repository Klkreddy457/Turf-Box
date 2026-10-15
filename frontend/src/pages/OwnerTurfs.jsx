import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../services/api.js";

function OwnerTurfs() {
    const [turfs, setTurfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTurfs();
    }, []);

    async function fetchTurfs() {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please login first.");
            }

            const response = await fetch(
                `${API_BASE_URL}/owner/turfs/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || data.detail || "Failed to load turfs"
                );
            }

            setTurfs(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function deactivateTurf(turfId) {
        const confirmed = window.confirm(
            "Are you sure you want to deactivate this turf?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/turfs/${turfId}/deactivate/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || data.detail || "Failed to deactivate turf"
                );
            }

            setTurfs((currentTurfs) =>
                currentTurfs.map((turf) =>
                    turf.id === turfId
                        ? { ...turf, is_active: false }
                        : turf
                )
            );
        } catch (error) {
            setError(error.message);
        }
    }

    async function reactivateTurf(turfId) {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_BASE_URL}/turfs/${turfId}/reactivate/`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Token ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.detail ||
                "Failed to reactivate turf"
            );
        }

        setTurfs((currentTurfs) =>
            currentTurfs.map((turf) =>
                turf.id === turfId
                    ? data
                    : turf
            )
        );

        } catch (error) {
            setError(error.message);
        }
    }

    if (loading) {
        return <h1>Loading your turfs...</h1>;
    }

    if (error) {
        return (
            <main>
                <h1>My Turfs</h1>
                <p>{error}</p>
            </main>
        );
    }

    return (
        <main>
            <h1>My Turfs</h1>

            <p>
                <Link to="/owner/turfs/create">
                    Create New Turf
                </Link>
            </p>

            {turfs.length === 0 ? (
                <p>You have not created any turfs yet.</p>
            ) : (
                <section>
                    {turfs.map((turf) => (
                        <div key={turf.id}>
                            <h2>{turf.name}</h2>

                            <p>
                                Location: {turf.location}
                            </p>

                            <p>
                                Price: ₹{turf.price_per_hour}/hour
                            </p>

                            <p>
                                Opening: {turf.opening_time}
                            </p>

                            <p>
                                Closing: {turf.closing_time}
                            </p>

                            <p>
                                Status:{" "}
                                {turf.is_active
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                            </p>

                            <Link
                                to={`/owner/turfs/${turf.id}/edit`}
                            >
                                Edit
                            </Link>

                            {" | "}

                            {turf.is_active ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        deactivateTurf(turf.id)
                                    }
                                    >
                                    Deactivate
                                </button>
                                    ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        reactivateTurf(turf.id)
                                    }
                                    >
                                    Reactivate
                                </button>
                            )}
                        </div>
                    ))}
                </section>
            )}
        </main>
    );
}

export default OwnerTurfs;