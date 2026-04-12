const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken } = require("../middleware/auth");

const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

// POST /users - Create user record in Firestore after Firebase Auth registration
router.post("/", verifyToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(200).json({ message: "User already exists" });
    }

    await userRef.set({
      email,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /users/me - Get current user's profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /users/me - Update current user's profile
router.put("/me", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const allowedFields = ["firstName", "lastName", "major", "school", "yearOfStudy", "bio"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field]).slice(0, 500);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    updates.updatedAt = FieldValue.serverTimestamp();
    await userRef.update(updates);

    const updated = await userRef.get();
    return res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
