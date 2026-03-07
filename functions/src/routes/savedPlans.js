const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken } = require("../middleware/auth");

const db = admin.firestore();

// GET /savedPlans - Get current user's saved plans
router.get("/", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const snapshot = await db.collection("savedPlans")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const savedPlans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(savedPlans);
  } catch (error) {
    console.error("Error fetching saved plans:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /savedPlans - Save a study plan
router.post("/", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Missing required field: planId" });
    }

    const planDoc = await db.collection("studyPlans").doc(planId).get();
    if (!planDoc.exists) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    // Prevent duplicate saves
    const existing = await db.collection("savedPlans")
      .where("userId", "==", uid)
      .where("planId", "==", planId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: "Plan already saved" });
    }

    const saveData = {
      userId: uid,
      planId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("savedPlans").add(saveData);
    return res.status(201).json({ id: docRef.id, ...saveData });
  } catch (error) {
    console.error("Error saving plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /savedPlans/:saveId - Remove a saved plan
router.delete("/:saveId", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { saveId } = req.params;

    const saveRef = db.collection("savedPlans").doc(saveId);
    const saveDoc = await saveRef.get();

    if (!saveDoc.exists) {
      return res.status(404).json({ error: "Saved plan not found" });
    }

    if (saveDoc.data().userId !== uid) {
      return res.status(403).json({ error: "Forbidden: You do not own this saved plan" });
    }

    await saveRef.delete();
    return res.status(200).json({ message: "Plan removed from saved list" });
  } catch (error) {
    console.error("Error removing saved plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
