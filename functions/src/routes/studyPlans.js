const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken, optionalAuth } = require("../middleware/auth");

const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

const VALID_STATUSES = ["draft", "published", "archived"];

function normalizeStatus(value) {
  if (!value) return "draft";
  return VALID_STATUSES.includes(value) ? value : null;
}

function getStatusTimestampUpdates(nextStatus, previousData = {}) {
  const updates = {
    archivedAt: nextStatus === "archived" ? FieldValue.serverTimestamp() : null,
  };

  if (nextStatus === "published" && !previousData.publishedAt) {
    updates.publishedAt = FieldValue.serverTimestamp();
  }

  return updates;
}

// GET /studyPlans - Get all public study plans (filter by course, sort, paginate)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { courseName, sortBy, limit = 10, startAfter } = req.query;
    let query = db.collection("studyPlans").where("status", "==", "published");

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

// GET /studyPlans/:planId - Public for published plans, owner-only otherwise
router.get("/:planId", optionalAuth, async (req, res) => {
  try {
    const { planId } = req.params;
    const planDoc = await db.collection("studyPlans").doc(planId).get();

    if (!planDoc.exists) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    const plan = planDoc.data();
    const isOwner = req.user && plan.userId === req.user.uid;
    if (plan.status !== "published" && !isOwner) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    return res.status(200).json({ id: planDoc.id, ...plan });
  } catch (error) {
    console.error("Error fetching study plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /studyPlans - Create a new study plan
router.post("/", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { title, courseName, semester, description, imageUrl, status } =
      req.body;

    const normalizedStatus = normalizeStatus(status);
    if (!normalizedStatus) {
      return res.status(400).json({
        error: 'Invalid status. Must be "draft", "published", or "archived".',
      });
    }

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
      status: normalizedStatus,
      upvoteCount: 0,
      downvoteCount: 0,
      score: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt:
        normalizedStatus === "published" ? FieldValue.serverTimestamp() : null,
      archivedAt:
        normalizedStatus === "archived" ? FieldValue.serverTimestamp() : null,
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
    const { title, courseName, semester, description, imageUrl, status } =
      req.body;

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
    if (status !== undefined) {
      const normalizedStatus = normalizeStatus(status);
      if (!normalizedStatus) {
        return res.status(400).json({
          error:
            'Invalid status. Must be "draft", "published", or "archived".',
        });
      }
      updates.status = normalizedStatus;
      Object.assign(updates, getStatusTimestampUpdates(normalizedStatus, planDoc.data()));
    }
    updates.updatedAt = FieldValue.serverTimestamp();

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
