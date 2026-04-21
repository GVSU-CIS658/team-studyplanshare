const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken } = require("../middleware/auth");
const { getPublishedStudyPlanError } = require("../utils/studyPlans");

const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

const VALID_VOTES = new Set(["up", "down"]);

// POST /votes/:planId - Cast or change a vote
router.post("/:planId", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.params;
    const { vote } = req.body;

    if (!vote || !VALID_VOTES.has(vote)) {
      return res
        .status(400)
        .json({ error: 'Invalid vote. Must be "up" or "down".' });
    }

    const planRef = db.collection("studyPlans").doc(planId);
    const voteRef = planRef.collection("votes").doc(uid);

    const planDoc = await planRef.get();
    const planError = getPublishedStudyPlanError(planDoc, "voted on");
    if (planError) {
      return res.status(planError.statusCode).json({ error: planError.error });
    }

    const existingVote = await voteRef.get();
    const batch = db.batch();

    if (existingVote.exists) {
      const previousVote = existingVote.data().vote;

      if (previousVote === vote) {
        return res.status(200).json({ message: "Vote unchanged", vote });
      }

      // Swap vote: undo old counts, apply new counts
      const inc = FieldValue.increment;
      const counterUpdates = {
        upvoteCount: inc(previousVote === "up" ? -1 : vote === "up" ? 1 : 0),
        downvoteCount: inc(
          previousVote === "down" ? -1 : vote === "down" ? 1 : 0,
        ),
        score: inc((vote === "up" ? 1 : -1) - (previousVote === "up" ? 1 : -1)),
      };

      batch.update(voteRef, { vote, updatedAt: FieldValue.serverTimestamp() });
      batch.update(planRef, counterUpdates);
    } else {
      // New vote
      batch.set(voteRef, {
        vote,
        createdAt: FieldValue.serverTimestamp(),
      });

      const counterUpdates = {
        score: FieldValue.increment(vote === "up" ? 1 : -1),
      };
      if (vote === "up") {
        counterUpdates.upvoteCount = FieldValue.increment(1);
      } else {
        counterUpdates.downvoteCount = FieldValue.increment(1);
      }
      batch.update(planRef, counterUpdates);
    }

    await batch.commit();

    return res.status(200).json({ message: "Vote recorded", vote });
  } catch (error) {
    console.error("Error casting vote:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /votes/:planId - Remove the current user's vote
router.delete("/:planId", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.params;

    const planRef = db.collection("studyPlans").doc(planId);
    const voteRef = planRef.collection("votes").doc(uid);

    const voteDoc = await voteRef.get();
    if (!voteDoc.exists) {
      return res.status(404).json({ error: "Vote not found" });
    }

    const { vote } = voteDoc.data();
    const batch = db.batch();
    batch.delete(voteRef);

    const counterUpdates = {
      score: FieldValue.increment(vote === "up" ? -1 : 1),
    };
    if (vote === "up") {
      counterUpdates.upvoteCount = FieldValue.increment(-1);
    } else {
      counterUpdates.downvoteCount = FieldValue.increment(-1);
    }
    batch.update(planRef, counterUpdates);

    await batch.commit();

    return res.status(200).json({ message: "Vote removed" });
  } catch (error) {
    console.error("Error removing vote:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
