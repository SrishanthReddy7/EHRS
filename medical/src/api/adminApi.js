import { apiRequest } from "./httpClient";

export const fetchDashboardStats = () => apiRequest("/api/admin/dashboard-stats");
export const fetchActiveConnections = () => apiRequest("/admin/active-connections");
export const fetchAdminStats = () => apiRequest("/admin/stats");

export const createConnection = (payload) =>
  apiRequest("/admin/connect", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const triggerAppointmentReminders = () =>
  apiRequest("/admin/reminders/run-now", {
    method: "POST",
  });
