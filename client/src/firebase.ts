import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  console.error(
    "[AUTH] Missing Firebase config:",
    missingFirebaseConfig.join(", "),
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const useAuthEmulator =
  import.meta.env.VITE_USE_FIREBASE_AUTH_EMULATOR === "true";

if (useAuthEmulator) {
  connectAuthEmulator(auth, "http://localhost:9099");
}
export default app;
