import { getBackendUrl } from "../config/env";

export function getImageUrl(path) {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const fixedPath = path.replaceAll("\\", "/");
  const apiBaseUrl = getBackendUrl();

  if (fixedPath.startsWith("/")) {
    return `${apiBaseUrl}${fixedPath}`;
  }

  return `${apiBaseUrl}/${fixedPath}`;
}
