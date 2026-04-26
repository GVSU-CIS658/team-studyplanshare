import { useCallback, useState } from "react";
import {
  removeStudyPlanVote,
  StudyPlan,
  StudyPlanVote,
  voteStudyPlan,
} from "../services/studyPlanService";
import { getApiErrorMessage } from "../services/apiClient";

interface UseVotesReturn {
  busyPlanId: string | null;
  vote: (plan: StudyPlan, direction: "up" | "down") => Promise<void>;
  getVoteState: (plan: StudyPlan) => StudyPlanVote;
}

interface UseVotesOptions {
  userId: string | undefined;
  authLoading: boolean;
  onRequireAuth: () => void;
  onError: (message: string) => void;
  onPlanUpdate: (updatedPlan: StudyPlan) => void;
  onReload: () => Promise<void>;
}

export function useVotes(options: UseVotesOptions): UseVotesReturn {
  const { userId, authLoading, onRequireAuth, onError, onPlanUpdate, onReload } =
    options;
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const getVoteState = useCallback((plan: StudyPlan): StudyPlanVote => {
    if (plan.myVote === "up" || plan.myVote === "down") {
      return plan.myVote;
    }
    return null;
  }, []);

  const calculateVoteChanges = (
    plan: StudyPlan,
    newVote: "up" | "down" | null,
    prevVote: StudyPlanVote
  ): Partial<StudyPlan> => {
    const scoreDelta =
      (newVote === "up" ? 1 : newVote === "down" ? -1 : 0) -
      (prevVote === "up" ? 1 : prevVote === "down" ? -1 : 0);

    return {
      myVote: newVote,
      score: (plan.score ?? 0) + scoreDelta,
      upvoteCount:
        (plan.upvoteCount || 0) +
        (newVote === "up" ? 1 : 0) -
        (prevVote === "up" ? 1 : 0),
      downvoteCount:
        (plan.downvoteCount || 0) +
        (newVote === "down" ? 1 : 0) -
        (prevVote === "down" ? 1 : 0),
    };
  };

  const vote = useCallback(
    async (plan: StudyPlan, direction: "up" | "down") => {
      if (authLoading) return;

      if (!userId) {
        onRequireAuth();
        return;
      }

      if (busyPlanId) return;

      const prevVote = getVoteState(plan);
      const isRemoving = prevVote === direction;

      setBusyPlanId(plan.id);

      try {
        if (isRemoving) {
          await removeStudyPlanVote(plan.id);
          onPlanUpdate({ ...plan, ...calculateVoteChanges(plan, null, prevVote) });
        } else {
          await voteStudyPlan(plan.id, direction);
          onPlanUpdate({
            ...plan,
            ...calculateVoteChanges(plan, direction, prevVote),
          });
        }
      } catch (voteError) {
        onError(getApiErrorMessage(voteError));
        await onReload();
      } finally {
        setBusyPlanId(null);
      }
    },
    [authLoading, userId, busyPlanId, getVoteState, onRequireAuth, onError, onPlanUpdate, onReload]
  );

  return { busyPlanId, vote, getVoteState };
}
