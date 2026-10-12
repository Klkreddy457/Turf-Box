# Turf Box 🏟️

Turf Box is a full-stack sports turf and venue booking platform built with React, Vite, and Django REST Framework.

## Features

- **Venue & Turf Booking**: Browse available turfs for various sports (Cricket, Football, Badminton, Basketball, Tennis, etc.).
- **Interactive Slots**: Dynamic time slot selection and real-time availability checking.
- **Payment Gateway**: Integrated Razorpay checkout flow.
- **Authentication**: JWT & Token-based user authentication.
- **RESTful API**: Robust Django backend with CORS and media handling.

---

## Tech Stack

- **Frontend**: React 19, Vite, React Router, Vanilla CSS
- **Backend**: Django 5.2, Django REST Framework, MySQL / SQLite
- **Payments**: Razorpay API

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)
- MySQL Server (or configured database)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Update .env with your Razorpay credentials

# Run database migrations
python manage.py migrate

# (Optional) Seed initial data
python seed_real_data.py
python upload_sport_images.py

# Start Django server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## License
MIT
