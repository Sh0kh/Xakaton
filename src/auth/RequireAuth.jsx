// src/auth/RequireAuth.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function RequireAuth() {
    const isAuth = useAuthStore((s) => s.isAuthenticated());
    const location = useLocation();

    if (!isAuth) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
