export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
export const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

export function getBackendUrl() {
  return BACKEND_URL.replace(/\/+$/, "");
}

export function getApiUrl() {
  return API_URL.replace(/\/+$/, "");
}

export function getWsUrl() {
  return WS_URL.replace(/\/+$/, "");
}
