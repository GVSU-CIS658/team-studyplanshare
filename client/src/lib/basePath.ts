const baseUrl = import.meta.env.BASE_URL;

export const appBasePath = baseUrl === "/" ? "/" : baseUrl.replace(/\/$/, "");
export const appPathPrefix = appBasePath === "/" ? "" : appBasePath;
