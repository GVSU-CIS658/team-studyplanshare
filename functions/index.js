const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const usersRouter = require("./src/routes/users");
const studyPlansRouter = require("./src/routes/studyPlans");
const savedPlansRouter = require("./src/routes/savedPlans");
const votesRouter = require("./src/routes/votes");

app.use("/users", usersRouter);
app.use("/studyPlans", studyPlansRouter);
app.use("/savedPlans", savedPlansRouter);
app.use("/votes", votesRouter);

exports.api = functions.https.onRequest(app);
