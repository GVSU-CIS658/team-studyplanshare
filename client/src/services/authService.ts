import {
  GithubAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { ensureUserRecord } from "./userService";

export interface AuthUser {
  uid: string;
  email: string | null;
  name?: string;
}

export function mapFirebaseUserToAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || undefined,
  };
}

async function finalizeAuthenticatedUser(user: User) {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("Failed to ensure user record after authentication", error);
  }
  return mapFirebaseUserToAuthUser(user);
}

export async function registerWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return finalizeAuthenticatedUser(userCredential.user);
}

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return finalizeAuthenticatedUser(userCredential.user);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithRedirect(auth, provider);
}

export async function loginWithGithub() {
  const provider = new GithubAuthProvider();
  provider.addScope("read:user");
  provider.addScope("user:email");
  await signInWithRedirect(auth, provider);
}

export async function completeRedirectAuth() {
  try {
    const userCredential = await getRedirectResult(auth);
    if (userCredential?.user) {
      return finalizeAuthenticatedUser(userCredential.user);
    }
    return null;
  } catch (error) {
    console.error("completeRedirectAuth error:", error);
    return null;
  }
}

export async function logout() {
  await signOut(auth);
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function getCurrentIdToken(
  forceRefresh = false,
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
}

export function onAuthStateChangedListener(
  callback: (user: AuthUser | null) => void,
) {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? mapFirebaseUserToAuthUser(user) : null);
  });
}
