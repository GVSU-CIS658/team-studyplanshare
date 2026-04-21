import apiClient from "./apiClient";

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  major?: string;
  school?: string;
  yearOfStudy?: string;
  bio?: string;
  createdAt?: string;
}

export type UserProfileUpdate = Pick<
  UserProfile,
  "firstName" | "lastName" | "major" | "school" | "yearOfStudy" | "bio"
>;
export async function ensureUserRecord(): Promise<void> {
  // This endpoint will create a user record in the database if it doesn't already exist. It will be called after a user logs in or registers to ensure that we have a corresponding record for them in our database.
  await apiClient.post("/users");
}

export async function getUserProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>("/users/me");
  return response.data;
}

export async function updateUserProfile(
  data: Partial<UserProfileUpdate>,
): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>("/users/me", data);
  return response.data;
}
