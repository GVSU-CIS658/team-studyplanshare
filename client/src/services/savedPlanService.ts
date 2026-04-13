import apiClient from "./apiClient";

export interface SavedPlan {
  id: string;
  userId: string;
  planId: string;
  createdAt?: unknown;
}

export async function getSavedPlans(): Promise<SavedPlan[]> {
  const response = await apiClient.get<SavedPlan[]>("/savedPlans");
  return response.data;
}

export async function savePlan(planId: string): Promise<SavedPlan> {
  const response = await apiClient.post<SavedPlan>("/savedPlans", { planId });
  return response.data;
}

export async function removeSavedPlan(saveId: string): Promise<void> {
  await apiClient.delete(`/savedPlans/${saveId}`);
}
