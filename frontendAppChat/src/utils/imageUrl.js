const API_BASE_URL = "http://localhost:8080";

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

  if (fixedPath.startsWith("/")) {
    return `${API_BASE_URL}${fixedPath}`;
  }

  return `${API_BASE_URL}/${fixedPath}`;
}
