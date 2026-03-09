import axios, { AxiosError } from "axios";
import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

type ApiErrorBody = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

function coerceApiErrorBody(
  data: unknown,
  statusCode?: number,
  statusText?: string,
): ApiErrorBody {
  if (data && typeof data === "object") {
    return data as ApiErrorBody;
  }

  if (typeof data === "string" && data.trim().length > 0) {
    return { message: data };
  }

  if (statusCode) {
    return {
      message: `Request failed with status ${statusCode}${
        statusText ? ` (${statusText})` : ""
      }`,
    };
  }

  return { message: "Request failed" };
}

export class ApiError extends Error {
  statusCode: number;
  errorBody: ApiErrorBody;

  constructor(statusCode: number, errorBody: ApiErrorBody) {
    super(
      errorBody.error ||
        errorBody.message ||
        `Request failed (${statusCode || "unknown"})`,
    );
    this.statusCode = statusCode;
    this.errorBody = errorBody;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody | string>) => {
    if (error.response) {
      const statusCode = error.response.status;
      const errorBody = coerceApiErrorBody(
        error.response.data,
        statusCode,
        error.response.statusText,
      );
      return Promise.reject(new ApiError(statusCode, errorBody));
    }

    if (error.request) {
      return Promise.reject(
        new ApiError(0, { message: "Network error: no response from server" }),
      );
    }

    return Promise.reject(new ApiError(0, { message: error.message }));
  },
);

function getStatusCodeMessage(statusCode: number): string | null {
  switch (true) {
    case statusCode === 404:
      return "Resource not found (404).";
    case statusCode === 401:
      return "Unauthorized. Please sign in again.";
    case statusCode === 403:
      return "Forbidden.";
    case statusCode >= 500:
      return "Server error. Please try again.";
    case statusCode > 0:
      return `Request failed (${statusCode}).`;
    default:
      return null;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const explicit =
      (typeof error.errorBody.error === "string" && error.errorBody.error) ||
      (typeof error.errorBody.message === "string" && error.errorBody.message);

    if (explicit) return explicit;

    const statusMessage = getStatusCodeMessage(error.statusCode);
    if (statusMessage) return statusMessage;

    return "Network error. Check your connection and backend server.";
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default apiClient;
