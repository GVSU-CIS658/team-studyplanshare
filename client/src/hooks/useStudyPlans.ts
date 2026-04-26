import { useCallback, useMemo, useState } from "react";
import { getAllStudyPlans, StudyPlan } from "../services/studyPlanService";
import { getApiErrorMessage } from "../services/apiClient";

type SortOption = "popular" | "newest" | "oldest" | "az";

interface UseStudyPlansReturn {
  plans: StudyPlan[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  displayedPlans: StudyPlan[];
  loadPlans: () => Promise<void>;
  updatePlan: (updatedPlan: StudyPlan) => void;
  clearError: () => void;
}

export function useStudyPlans(): UseStudyPlansReturn {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllStudyPlans();
      setPlans(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlan = useCallback((updatedPlan: StudyPlan) => {
    setPlans((prev) =>
      prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
    );
  }, []);

  const displayedPlans = useMemo(() => {
    let result = plans;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.courseName.toLowerCase().includes(q) ||
          p.semester.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (
            (b.score ?? b.upvoteCount ?? 0) - (a.score ?? a.upvoteCount ?? 0)
          );
        case "newest": {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        case "oldest": {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        }
        case "az":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [plans, search, sortBy]);

  const clearError = useCallback(() => setError(null), []);

  return {
    plans,
    loading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    displayedPlans,
    loadPlans,
    updatePlan,
    clearError,
  };
}
