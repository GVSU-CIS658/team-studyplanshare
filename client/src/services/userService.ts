import apiClient from "./apiClient";

export interface UserProfile {
  id: string;
  email: string;
  createdAt?: string;
}
export async function ensureUserRecord(): Promise<void> {
  // This endpoint will create a user record in the database if it doesn't already exist. It will be called after a user logs in or registers to ensure that we have a corresponding record for them in our database.
  await apiClient.post("/users/ensure");
}

export async function getUserProfile(): Promise<UserProfile> {
  // This endpoint will return the user's profile information, including their email and any other relevant details.
  const response = await apiClient.get<UserProfile>("/users/profile");
  return response.data;
}
