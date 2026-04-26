import axios, { AxiosError } from "axios";
import { auth } from "../firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") || "/api";

type ApiErrorBody = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

type ErrorWithCode = Error & {
  code?: string;
  customData?: {
    email?: string;
    [key: string]: unknown;
  };
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

function getFirebaseErrorMessage(error: ErrorWithCode): string | null {
  const code = error.code || "";
  const rawMessage = error.message || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "That email is already being used. Try logging in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";
    case "auth/missing-password":
      return "Enter your password to continue.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was canceled before it finished.";
    case "auth/requires-recent-login":
      return "Please sign in again before trying that action.";
    default:
      break;
  }

  if (rawMessage.toLowerCase().includes("firebase")) {
    if (rawMessage.toLowerCase().includes("invalid-login-credentials")) {
      return "Incorrect email or password.";
    }

    if (rawMessage.toLowerCase().includes("email-already-in-use")) {
      return "That email is already being used. Try logging in instead.";
    }

    if (rawMessage.toLowerCase().includes("weak-password")) {
      return "Choose a stronger password with at least 6 characters.";
    }

    return "Something went wrong with sign-in. Please try again.";
  }

  return null;
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

  if (error instanceof Error) {
    const firebaseMessage = getFirebaseErrorMessage(error as ErrorWithCode);
    if (firebaseMessage) return firebaseMessage;
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default apiClient;
