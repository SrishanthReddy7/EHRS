import React from "react";
import { Navigate } from "react-router-dom";

const parseJwtPayload = (token) => {
  try {
    const [, payload] = token.split(".");
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  let user = getStoredUser();

  // Recover session user from token payload on refresh when user object is missing/corrupt.
  if (!user && token) {
    const payload = parseJwtPayload(token);
    if (payload?.role && payload?.username) {
      user = {
        _id: payload.id,
        username: payload.username,
        role: payload.role,
      };
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (token && isTokenExpired(token)) {
    localStorage.removeItem("token");
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
