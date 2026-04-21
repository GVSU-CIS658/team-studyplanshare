// Seed script for local development
// Requires: firebase emulators:start running
// Run from repo root with: node functions/scripts/seed.js

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const admin = require("firebase-admin");

admin.initializeApp({ projectId: "study-plan-share" });

const API_BASE = "http://127.0.0.1:5001/study-plan-share/us-central1/api";
const AUTH_EMULATOR = "http://127.0.0.1:9099";

const TEST_USERS = [
  { email: "alice@test.com", password: "password123" },
  { email: "bob@test.com", password: "password123" },
];

async function signIn(email, password) {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error(`Sign in failed for ${email}: ${JSON.stringify(data)}`);
  return data.idToken;
}

async function api(method, path, token, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${JSON.stringify(data)}`);
  return data;
}

async function createOrGetUser(email, password) {
  try {
    const user = await admin.auth().createUser({ email, password });
    console.log(`  Created: ${email}`);
    return user;
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      console.log(`  Already exists: ${email}`);
      return admin.auth().getUserByEmail(email);
    }
    throw err;
  }
}

async function seed() {
  console.log("Creating Auth users...");
  for (const u of TEST_USERS) {
    await createOrGetUser(u.email, u.password);
  }

  console.log("\nSigning in...");
  const [aliceToken, bobToken] = await Promise.all(
    TEST_USERS.map((u) => signIn(u.email, u.password))
  );
  console.log("  alice@test.com signed in");
  console.log("  bob@test.com signed in");

  console.log("\nCreating Firestore user records...");
  await api("POST", "/users", aliceToken);
  await api("POST", "/users", bobToken);
  console.log("  Done");

  console.log("\nCreating study plans...");
  const [plan1, plan2, plan3, plan4] = await Promise.all([
    api("POST", "/studyPlans", aliceToken, {
      title: "CIS 658 Full Stack Study Guide",
      courseName: "CIS 658",
      semester: "Fall 2024",
      description: "Comprehensive guide covering React, Firebase, and Cloud Functions.",
    }),
    api("POST", "/studyPlans", aliceToken, {
      title: "Data Structures Weekly Plan",
      courseName: "CIS 263",
      semester: "Fall 2024",
      description: "Weekly breakdown of topics: arrays, linked lists, trees, and graphs.",
    }),
    api("POST", "/studyPlans", bobToken, {
      title: "Algorithms Exam Prep",
      courseName: "CIS 351",
      semester: "Spring 2025",
      description: "Focused review of sorting, searching, and dynamic programming.",
    }),
    api("POST", "/studyPlans", bobToken, {
      title: "Operating Systems Notes",
      courseName: "CIS 452",
      semester: "Spring 2025",
      description: "Notes on processes, threads, memory management, and file systems.",
    }),
  ]);
  console.log(`  Created: "${plan1.title}"`);
  console.log(`  Created: "${plan2.title}"`);
  console.log(`  Created: "${plan3.title}"`);
  console.log(`  Created: "${plan4.title}"`);

  console.log("\nSaving plans...");
  await api("POST", "/savedPlans", bobToken, { planId: plan1.id });
  await api("POST", "/savedPlans", aliceToken, { planId: plan3.id });
  console.log("  Done");

  console.log("\nVoting on plans...");
  // Bob upvotes both of Alice's plans
  await api("POST", "/votes/" + plan1.id, bobToken, { vote: "up" });
  await api("POST", "/votes/" + plan2.id, bobToken, { vote: "up" });
  // Alice upvotes Bob's Algorithms plan, downvotes OS notes
  await api("POST", "/votes/" + plan3.id, aliceToken, { vote: "up" });
  await api("POST", "/votes/" + plan4.id, aliceToken, { vote: "down" });
  console.log("  Done");

  console.log("\nSeed complete. Test credentials:");
  TEST_USERS.forEach((u) => console.log(`  ${u.email} / ${u.password}`));
}

seed().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
