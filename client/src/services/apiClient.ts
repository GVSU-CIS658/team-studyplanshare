import axios, { AxiosError } from "axios";
import { auth } from "../firebase";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";

type ApiErrorBody = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  statusCode: number;
  errorBody: ApiErrorBody;

  constructor(statusCode: number, errorBody: ApiErrorBody) {
    super(errorBody.error || errorBody.message || "API Error");
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
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      return Promise.reject(
        new ApiError(error.response.status, error.response.data || {}),
      );
    }

    if (error.request) {
      return Promise.reject(
        new ApiError(0, { error: "No response from server" }),
      );
    }

    return Promise.reject(new ApiError(0, { error: error.message }));
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      error.errorBody.error || error.errorBody.message || "Unknown API error"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default apiClient;
