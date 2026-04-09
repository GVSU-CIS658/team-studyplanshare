const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken, optionalAuth } = require("../middleware/auth");

const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
// GET /studyPlans - Get all public study plans (filter by course, sort, paginate)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { courseName, sortBy, limit = 10, startAfter } = req.query;
    let query = db.collection("studyPlans");

    if (courseName) {
      query = query.where("courseName", "==", courseName);
    }

    if (sortBy === "popular") {
      query = query.orderBy("score", "desc");
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    query = query.limit(parseInt(limit));

    if (startAfter) {
      const startAfterDoc = await db
        .collection("studyPlans")
        .doc(startAfter)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      downvoteCount: doc.data().downvoteCount || 0,
      score: doc.data().score || 0,
      myVote: null,
    }));

    // If authenticated, look up the user's votes for these plans
    if (req.user && plans.length > 0) {
      const uid = req.user.uid;
      const voteReads = plans.map((plan) =>
        db
          .collection("studyPlans")
          .doc(plan.id)
          .collection("votes")
          .doc(uid)
          .get(),
      );
      const voteDocs = await Promise.all(voteReads);

      voteDocs.forEach((voteDoc, i) => {
        if (voteDoc.exists) {
          plans[i].myVote = voteDoc.data().vote;
        }
      });
    }

    return res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching study plans:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /studyPlans/my - Get the current user's uploaded plans
router.get("/my", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const snapshot = await db
      .collection("studyPlans")
      .where("userId", "==", uid)
      .get();

    const plans = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aMillis =
          typeof a.createdAt?.toMillis === "function"
            ? a.createdAt.toMillis()
            : 0;
        const bMillis =
          typeof b.createdAt?.toMillis === "function"
            ? b.createdAt.toMillis()
            : 0;
        return bMillis - aMillis;
      });

    return res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching user study plans:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /studyPlans/:planId - Public: Get a single study plan
router.get("/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    const planDoc = await db.collection("studyPlans").doc(planId).get();

    if (!planDoc.exists) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    return res.status(200).json({ id: planDoc.id, ...planDoc.data() });
  } catch (error) {
    console.error("Error fetching study plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /studyPlans - Create a new study plan
router.post("/", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { title, courseName, semester, description, imageUrl } = req.body;

    if (!title || !courseName || !semester || !description) {
      return res.status(400).json({
        error:
          "Missing required fields: title, courseName, semester, description",
      });
    }

    const newPlan = {
      title,
      courseName,
      semester,
      description,
      imageUrl: imageUrl || null,
      userId: uid,
      upvoteCount: 0,
      downvoteCount: 0,
      score: 0,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("studyPlans").add(newPlan);
    return res.status(201).json({ id: docRef.id, ...newPlan });
  } catch (error) {
    console.error("Error creating study plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /studyPlans/:planId - Update a study plan (owner only)
router.put("/:planId", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.params;
    const { title, courseName, semester, description, imageUrl } = req.body;

    const planRef = db.collection("studyPlans").doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    if (planDoc.data().userId !== uid) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this study plan" });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (courseName !== undefined) updates.courseName = courseName;
    if (semester !== undefined) updates.semester = semester;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;

    await planRef.update(updates);
    return res.status(200).json({ message: "Study plan updated successfully" });
  } catch (error) {
    console.error("Error updating study plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /studyPlans/:planId - Delete a study plan (owner only)
router.delete("/:planId", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.params;

    const planRef = db.collection("studyPlans").doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    if (planDoc.data().userId !== uid) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this study plan" });
    }

    await planRef.delete();
    return res.status(200).json({ message: "Study plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting study plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
