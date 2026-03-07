const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken } = require("../middleware/auth");

const db = admin.firestore();

// POST /upvotes/:planId - Upvote a study plan
router.post("/:planId", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.params;

    const planRef = db.collection("studyPlans").doc(planId);
    const upvoteRef = planRef.collection("upvotes").doc(uid);

    const planDoc = await planRef.get();
    if (!planDoc.exists) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    const upvoteDoc = await upvoteRef.get();
    if (upvoteDoc.exists) {
      return res.status(409).json({ error: "Already upvoted this plan" });
    }

    // Atomic batch: create upvote record + increment counter
    const batch = db.batch();
    batch.set(upvoteRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
    batch.update(planRef, { upvoteCount: admin.firestore.FieldValue.increment(1) });
    await batch.commit();

    return res.status(201).json({ message: "Plan upvoted successfully" });
  } catch (error) {
    console.error("Error upvoting plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /upvotes/:planId - Remove upvote from a study plan
router.delete("/:planId", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.params;

    const planRef = db.collection("studyPlans").doc(planId);
    const upvoteRef = planRef.collection("upvotes").doc(uid);

    const upvoteDoc = await upvoteRef.get();
    if (!upvoteDoc.exists) {
      return res.status(404).json({ error: "Upvote not found" });
    }

    // Atomic batch: delete upvote record + decrement counter
    const batch = db.batch();
    batch.delete(upvoteRef);
    batch.update(planRef, { upvoteCount: admin.firestore.FieldValue.increment(-1) });
    await batch.commit();

    return res.status(200).json({ message: "Upvote removed successfully" });
  } catch (error) {
    console.error("Error removing upvote:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
