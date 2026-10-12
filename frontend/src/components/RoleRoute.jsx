import { Navigate } from "react-router-dom";

function RoleRoute({ children, role }) {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!userString) {
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userString);
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
    }

    if (!user?.role) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
    }

    if (user.role !== role) {
        if (user.role === "owner") {
            return <Navigate to="/owner/dashboard" replace />;
        }

        if (user.role === "customer") {
            return <Navigate to="/turfs" replace />;
        }

        return <Navigate to="/" replace />;
    }

    return children;
}

export default RoleRoute;