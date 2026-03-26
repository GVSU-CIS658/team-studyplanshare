export async function getAllStudyPlans(): Promise<StudyPlan[]> {
  const response = await apiClient.get<StudyPlan[]>(
    "/studyPlans?limit=50&sortBy=popular",
  );
  return response.data;
}
import apiClient from "./apiClient";

export interface StudyPlan {
  id: string;
  title: string;
  courseName: string;
  semester: string;
  description: string;
  imageUrl?: string | null;
  userId: string;
  upvoteCount: number;
  hasUpvoted?: boolean;
  createdAt?: unknown;
}

export interface StudyPlanInput {
  title: string;
  courseName: string;
  semester: string;
  description: string;
  imageUrl?: string;
}

export async function getMyStudyPlans(): Promise<StudyPlan[]> {
  const response = await apiClient.get<StudyPlan[]>("/studyPlans/my");
  return response.data;
}

export async function createStudyPlan(
  payload: StudyPlanInput,
): Promise<StudyPlan> {
  const response = await apiClient.post<StudyPlan>("/studyPlans", payload);
  return response.data;
}

export async function updateStudyPlan(
  planId: string,
  payload: Partial<StudyPlanInput>,
): Promise<void> {
  await apiClient.put(`/studyPlans/${planId}`, payload);
}

export async function deleteStudyPlan(planId: string): Promise<void> {
  await apiClient.delete(`/studyPlans/${planId}`);
}

export async function upvoteStudyPlan(planId: string): Promise<void> {
  await apiClient.post(`/upvotes/${planId}`);
}

export async function removeStudyPlanUpvote(planId: string): Promise<void> {
  await apiClient.delete(`/upvotes/${planId}`);
}
