export const API_BASE_URL = "http://localhost:5000";

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const parseResponseBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new ApiError(payload?.message || payload?.error || "Request failed", response.status, payload);
  }
  return payload;
};
