export function apiUrl(path: string): string {
  if (process.env.NEXT_PUBLIC_TRUTHLENS_CLOUD_API === "true") {
    return path.replace(/^\/api\//, "/api/cloud/");
  }
  return path;
}
