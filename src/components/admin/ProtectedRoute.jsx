import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();

  const token = localStorage.getItem("adminToken");

  // Kalau belum login, arahkan ke halaman login
  if (!token) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // Kalau sudah login, izinkan masuk
  return <Outlet />;
}

export default ProtectedRoute;