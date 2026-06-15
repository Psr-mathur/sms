export function getApiUrl(path: string): string {
  const baseUrl = localStorage.getItem("backend_base_url") || "";
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  
  if (cleanBase) {
    return `${cleanBase}/${cleanPath}`;
  }
  return `/${cleanPath}`;
}

export async function fetchWithBase(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  options.credentials = "include";
  return fetch(url, options);
}
