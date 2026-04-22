import { apiRequest } from "./httpClient";

export const loginUser = async ({ username, password }) => {
  return apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
};

export const verifySessionToken = async () => {
  return apiRequest("/api/auth/verify", { method: "GET" });
};
