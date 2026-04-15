import apiClient from "./apiClient";

export async function getAllStudyPlans(): Promise<StudyPlan[]> {
  const response = await apiClient.get<StudyPlan[]>("/studyPlans?limit=50");
  return response.data;
}

export type StudyPlanVote = "up" | "down" | null;

export type StudyPlanStatus = "draft" | "published" | "archived";

export interface StudyPlan {
  id: string;
  title: string;
  courseName: string;
  semester: string;
  description: string;
  imageUrl?: string | null;
  userId: string;
  upvoteCount: number;
  downvoteCount?: number;
  score?: number;
  myVote?: StudyPlanVote;
  hasUpvoted?: boolean;

  createdAt?: string;
  updatedAt?: string;

  status: StudyPlanStatus;
  publishedAt?: string | null;
  archivedAt?: string | null;
}

export interface StudyPlanInput {
  title: string;
  courseName: string;
  semester: string;
  description: string;
  imageUrl?: string | null;
  status: StudyPlanStatus;
}

export async function getStudyPlan(planId: string): Promise<StudyPlan> {
  const response = await apiClient.get<StudyPlan>(`/studyPlans/${planId}`);
  return response.data;
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

export async function voteStudyPlan(
  planId: string,
  vote: "up" | "down",
): Promise<void> {
  await apiClient.post(`/votes/${planId}`, { vote });
}

export async function removeStudyPlanVote(planId: string): Promise<void> {
  await apiClient.delete(`/votes/${planId}`);
}
