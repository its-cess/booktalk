import axios from "axios";

let _token: string | null = null;
let _sessionExpiredHandler: (() => void) | null = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && _token && !isAuthEndpoint && _sessionExpiredHandler) {
      _token = null;
      _sessionExpiredHandler();
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  _token = token;
}

export function setSessionExpiredHandler(fn: () => void) {
  _sessionExpiredHandler = fn;
}
