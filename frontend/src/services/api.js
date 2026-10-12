const API_BASE_URL = "http://127.0.0.1:8000/api";

export function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/media/")) return `http://127.0.0.1:8000${url}`;
  if (url.startsWith("media/")) return `http://127.0.0.1:8000/${url}`;
  return url;
}

function getHeaders(isAuthRequired = false) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (isAuthRequired) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }
  }
  return headers;
}

export async function fetchTurfs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/turfs/${query ? `?${query}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch turfs");
  return res.json();
}

export async function fetchTurfById(turfId) {
  const res = await fetch(`${API_BASE_URL}/turfs/${turfId}/`);
  if (!res.ok) throw new Error("Failed to fetch turf details");
  return res.json();
}

export async function fetchTurfAvailability(turfId, dateStr) {
  const res = await fetch(`${API_BASE_URL}/turfs/${turfId}/availability/?date=${dateStr}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to fetch turf availability");
  }
  return res.json();
}

export async function createBooking({ turf_id, booking_date, start_time, end_time }) {
  const res = await fetch(`${API_BASE_URL}/bookings/`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({
      turf_id: Number(turf_id),
      booking_date,
      start_time,
      end_time,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    let msg = "Booking creation failed";
    if (typeof data === "object") {
      msg = data.error || data.detail || Object.values(data).flat().join(" ") || msg;
    }
    throw new Error(msg);
  }
  return data;
}

export async function fetchMyBookings() {
  const res = await fetch(`${API_BASE_URL}/my-bookings/`, {
    headers: getHeaders(true),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch bookings");
  }
  return res.json();
}

export async function cancelBooking(bookingId) {
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel/`, {
    method: "PATCH",
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.detail || "Failed to cancel booking");
  }
  return data;
}

export async function createPaymentOrder(bookingId) {
  const res = await fetch(`${API_BASE_URL}/payments/create-order/`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({ booking_id: bookingId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create payment order");
  }
  return data;
}

export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const res = await fetch(`${API_BASE_URL}/payments/verify/`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Payment verification failed");
  }
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE_URL}/login/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.detail || "Login failed");
  }
  return data;
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/register/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.detail || "Registration failed");
  }
  return data;
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/me/`, {
    headers: getHeaders(true),
  });
  if (!res.ok) throw new Error("Failed to fetch current user");
  return res.json();
}
