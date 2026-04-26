const baseUrl = import.meta.env.BASE_URL;

export const appBasePath = baseUrl === "/" ? "/" : baseUrl.replace(/\/$/, "");
export const appPathPrefix = appBasePath === "/" ? "" : appBasePath;

export function stripAppBasePath(path: string): string {
  if (!path) return "/";
  if (appBasePath === "/") return path;

  return path.startsWith(appBasePath)
    ? path.slice(appBasePath.length) || "/"
    : path;
}

export function normalizeClientPath(path: string): string {
  const withoutBase = stripAppBasePath(path);
  if (!withoutBase) return "/";
  return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;
}

export function withAppBasePath(path: string): string {
  const normalizedPath = normalizeClientPath(path);
  return `${appPathPrefix}${normalizedPath}`;
}
