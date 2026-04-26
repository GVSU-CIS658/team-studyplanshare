import { useCallback, useState } from "react";
import {
  getSavedPlans,
  removeSavedPlan,
  savePlan,
} from "../services/savedPlanService";
import { getApiErrorMessage } from "../services/apiClient";

interface UseSavedPlansReturn {
  savedPlanMap: Map<string, string>;
  savingPlanId: string | null;
  loadSavedPlans: () => Promise<void>;
  toggleSave: (planId: string) => Promise<void>;
  isSaved: (planId: string) => boolean;
  isSaving: (planId: string) => boolean;
}

interface UseSavedPlansOptions {
  userId: string | undefined;
  onRequireAuth: () => void;
  onError: (message: string) => void;
}

export function useSavedPlans(options: UseSavedPlansOptions): UseSavedPlansReturn {
  const { userId, onRequireAuth, onError } = options;
  const [savedPlanMap, setSavedPlanMap] = useState<Map<string, string>>(new Map());
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);

  const loadSavedPlans = useCallback(async () => {
    if (!userId) return;
    try {
      const saves = await getSavedPlans();
      setSavedPlanMap(new Map(saves.map((s) => [s.planId, s.id])));
    } catch {
      // Non-critical, don't block the page
    }
  }, [userId]);

  const toggleSave = useCallback(
    async (planId: string) => {
      if (!userId) {
        onRequireAuth();
        return;
      }

      if (savingPlanId) return;

      setSavingPlanId(planId);

      try {
        const existingSaveId = savedPlanMap.get(planId);
        if (existingSaveId) {
          await removeSavedPlan(existingSaveId);
          setSavedPlanMap((prev) => {
            const next = new Map(prev);
            next.delete(planId);
            return next;
          });
        } else {
          const saved = await savePlan(planId);
          setSavedPlanMap((prev) => new Map(prev).set(planId, saved.id));
        }
      } catch (saveError) {
        onError(getApiErrorMessage(saveError));
      } finally {
        setSavingPlanId(null);
      }
    },
    [userId, savingPlanId, savedPlanMap, onRequireAuth, onError]
  );

  const isSaved = useCallback(
    (planId: string) => savedPlanMap.has(planId),
    [savedPlanMap]
  );

  const isSaving = useCallback(
    (planId: string) => savingPlanId === planId,
    [savingPlanId]
  );

  return {
    savedPlanMap,
    savingPlanId,
    loadSavedPlans,
    toggleSave,
    isSaved,
    isSaving,
  };
}
