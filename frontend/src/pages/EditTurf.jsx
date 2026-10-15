import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../services/api.js";

function EditTurf() {
    const { turfId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        address: "",
        description: "",
        price_per_hour: "",
        opening_time: "",
        closing_time: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTurf();
    }, []);

    async function fetchTurf() {
        try {
            const response = await fetch(
                `${API_BASE_URL}/turfs/${turfId}/`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to load turf"
                );
            }

            setFormData({
                name: data.name || "",
                location: data.location || "",
                address: data.address || "",
                description: data.description || "",
                price_per_hour: data.price_per_hour || "",
                opening_time: data.opening_time?.slice(0, 5) || "",
                closing_time: data.closing_time?.slice(0, 5) || "",
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please login first.");
            }

            const response = await fetch(
                `${API_BASE_URL}/turfs/${turfId}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.detail ||
                    "Failed to update turf"
                );
            }

            alert("Turf updated successfully!");

            navigate("/owner/turfs");
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <h1>Loading turf...</h1>;
    }

    return (
        <main>
            <h1>Edit Turf</h1>

            {error && (
                <p>{error}</p>
            )}

            <form onSubmit={handleSubmit}>

                <div>
                    <label>
                        Turf Name
                    </label>

                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>
                        Location
                    </label>

                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>
                        Address
                    </label>

                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>
                        Description
                    </label>

                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>
                        Price Per Hour
                    </label>

                    <input
                        type="number"
                        name="price_per_hour"
                        value={formData.price_per_hour}
                        onChange={handleChange}
                        min="0"
                        required
                    />
                </div>

                <div>
                    <label>
                        Opening Time
                    </label>

                    <input
                        type="time"
                        name="opening_time"
                        value={formData.opening_time}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>
                        Closing Time
                    </label>

                    <input
                        type="time"
                        name="closing_time"
                        value={formData.closing_time}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Changes"}
                </button>

            </form>
        </main>
    );
}

export default EditTurf;