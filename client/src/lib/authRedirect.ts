import { normalizeClientPath } from "./basePath";

export const REDIRECT_KEY = "sps.redirectAfterLogin";

export function setRedirectTarget(pathname: string, searchStr: string): void {
  const nextPath = normalizeClientPath(`${pathname}${searchStr}`);
  sessionStorage.setItem(REDIRECT_KEY, nextPath);
}

export function getRedirectTarget(fallback = "/"): string {
  return normalizeClientPath(sessionStorage.getItem(REDIRECT_KEY) || fallback);
}

export function clearRedirectTarget(): void {
  sessionStorage.removeItem(REDIRECT_KEY);
}
