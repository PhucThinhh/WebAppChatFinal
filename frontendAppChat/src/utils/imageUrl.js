import { getBackendUrl } from "../config/env";

export const DEFAULT_AVATAR_URL = "/default-avatar.svg";

export function getImageUrl(path) {
  if (!path) return "";

  const rawPath = String(path).trim();
  if (!rawPath) return "";

  const apiBaseUrl = getBackendUrl();

  if (
    rawPath.startsWith("http://") ||
    rawPath.startsWith("https://")
  ) {
    if (rawPath.includes("localhost:8080")) {
      return rawPath.replace(/^https?:\/\/localhost:8080/i, apiBaseUrl);
    }

    if (rawPath.includes("127.0.0.1:8080")) {
      return rawPath.replace(/^https?:\/\/127\.0\.0\.1:8080/i, apiBaseUrl);
    }

    if (rawPath.includes("10.0.2.2:8080")) {
      return rawPath.replace(/^https?:\/\/10\.0\.2\.2:8080/i, apiBaseUrl);
    }

    return rawPath;
  }

  if (rawPath.startsWith("data:") || rawPath.startsWith("blob:")) {
    return rawPath;
  }

  const fixedPath = rawPath.replaceAll("\\", "/");
  const normalized = fixedPath.replace(/^\/+/, "");

  if (
    normalized === "default-avatar.png" ||
    normalized === "default-avatar.svg" ||
    normalized === "avatar" ||
    normalized === "null" ||
    normalized === "undefined"
  ) {
    return DEFAULT_AVATAR_URL;
  }

  if (fixedPath.startsWith("/")) {
    return `${apiBaseUrl}${fixedPath}`;
  }

  return `${apiBaseUrl}/${fixedPath}`;
}
