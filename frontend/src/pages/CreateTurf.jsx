import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTurf.css";

function CreateTurf() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    description: "",
    price_per_hour: "",
    opening_time: "06:00",
    closing_time: "23:00",
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleImageChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Filter image files only
    const validImages = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validImages.length === 0) {
      setError("Please select valid image files.");
      return;
    }

    setImages((prevImages) => {
      const combined = [...prevImages, ...validImages];
      if (combined.length > 10) {
        setError("Maximum 10 images allowed. Kept first 10 images.");
        return combined.slice(0, 10);
      }
      setError("");
      return combined;
    });

    // Reset input value so same file can be selected again if needed
    event.target.value = "";
  }

  function removeImage(indexToRemove) {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function uploadImages(turfId, token) {
    if (images.length === 0) return;

    const imageData = new FormData();
    images.forEach((image) => {
      imageData.append("images", image);
    });

    const response = await fetch(`http://127.0.0.1:8000/api/turfs/${turfId}/images/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: imageData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload images");
    }
    return data;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login first.");

      const response = await fetch("http://127.0.0.1:8000/api/owner/turfs/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to create turf");
      }

      const turfId = data.id;
      if (!turfId) throw new Error("Turf created, but Turf ID was not returned.");

      if (images.length > 0) {
        setMessage("Turf created! Uploading photos...");
        await uploadImages(turfId, token);
      }

      setMessage("Turf & sports photos created successfully!");
      setTimeout(() => {
        navigate("/owner/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-turf-container">
      <div className="create-turf-card">
        <div className="card-header-banner">
          <h1>Add New Turf Ground</h1>
          <p>List your sports turf and upload photos for Football, Cricket, Badminton & more</p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {message && <div className="alert-success">{message}</div>}

        <form onSubmit={handleSubmit} className="turf-form">
          <div className="form-grid">
            <div className="form-group span-2">
              <label htmlFor="name">Turf Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. GreenKick Arena - Football & Cricket"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">City / Region *</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Dhanmondi, Hyderabad"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price_per_hour">Price Per Hour (₹) *</label>
              <input
                id="price_per_hour"
                name="price_per_hour"
                type="number"
                value={formData.price_per_hour}
                onChange={handleChange}
                placeholder="e.g. 2000"
                min="0"
                required
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="address">Full Address</label>
              <textarea
                id="address"
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Plot 12, Road 5, Dhanmondi, Hyderabad"
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="description">Turf Description & Facilities</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe turf, floodlights, parking, and sports (Football, Box Cricket, Badminton, etc.)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="opening_time">Opening Time *</label>
              <input
                id="opening_time"
                name="opening_time"
                type="time"
                value={formData.opening_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="closing_time">Closing Time *</label>
              <input
                id="closing_time"
                name="closing_time"
                type="time"
                value={formData.closing_time}
                onChange={handleChange}
                required
              />
            </div>

            {/* MULTI-SPORT IMAGE UPLOADER */}
            <div className="form-group span-2 image-upload-box">
              <label htmlFor="images">Upload Turf Photos ({images.length}/10 selected)</label>
              <div className="file-input-wrapper">
                <input
                  id="images"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="file-input-field"
                />
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <strong>Click to select turf photos</strong>
                  <small>Upload photos for Football pitch, Cricket box, Badminton court, Lights, Parking, etc.</small>
                </div>
              </div>

              {images.length > 0 && (
                <div className="image-previews-grid">
                  {images.map((image, index) => (
                    <div key={index} className="preview-thumb">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Turf preview ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="remove-thumb-btn"
                        onClick={() => removeImage(index)}
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary full-width">
              {loading ? "Creating Turf & Uploading Images..." : "Create Turf Ground"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTurf;