import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Turfs from "../pages/Turfs";
import TurfDetail from "../pages/TurfDetail";
import Booking from "../pages/Booking";
import MyBookings from "../pages/MyBookings";

import OwnerDashboard from "../pages/OwnerDashboard";
import OwnerBookings from "../pages/OwnerBookings";
import OwnerTurfs from "../pages/OwnerTurfs";
import CreateTurf from "../pages/CreateTurf";
import EditTurf from "../pages/EditTurf";

import RoleRoute from "../components/RoleRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/turfs" element={<Turfs />} />
      <Route path="/turfs/:turfId" element={<TurfDetail />} />

      {/* Customer routes */}
      <Route
        path="/booking/:turfId"
        element={
          <RoleRoute role="customer">
            <Booking />
          </RoleRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <RoleRoute role="customer">
            <MyBookings />
          </RoleRoute>
        }
      />

      {/* Owner routes */}
      <Route
        path="/owner/dashboard"
        element={
          <RoleRoute role="owner">
            <OwnerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/owner/bookings"
        element={
          <RoleRoute role="owner">
            <OwnerBookings />
          </RoleRoute>
        }
      />
      <Route
        path="/owner/turfs"
        element={
          <RoleRoute role="owner">
            <OwnerTurfs />
          </RoleRoute>
        }
      />
      <Route
        path="/owner/turfs/create"
        element={
          <RoleRoute role="owner">
            <CreateTurf />
          </RoleRoute>
        }
      />
      <Route
        path="/owner/turfs/:turfId/edit"
        element={
          <RoleRoute role="owner">
            <EditTurf />
          </RoleRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;