import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Public pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import BookRoom from "./pages/BookRoom";
import MyReservations from "./pages/MyReservations";
import Profile from "./pages/Profile";

// Admin pages
import AdminPanel from "./pages/admin/AdminPanel";

function App() {
  return (
    <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(30, 30, 46, 0.95)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#4ade80", secondary: "#0f172a" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#0f172a" } },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Protected routes wrapped in Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <Layout><Rooms /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <ProtectedRoute>
                <Layout><BookRoom /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reservations"
            element={
              <ProtectedRoute>
                <Layout><MyReservations /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Layout><AdminPanel /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </AuthProvider>
  );
}

export default App;
