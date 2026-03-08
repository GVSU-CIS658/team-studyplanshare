import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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

export async function registerWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;
  await ensureUserRecord();
  return mapFirebaseUserToAuthUser(user);
}

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;
  await ensureUserRecord();
  return mapFirebaseUserToAuthUser(user);
}

export async function logout() {
  await signOut(auth);
}

export async function getCurrentIdToken(
  forceRefresh = false,
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return await user.getIdToken(forceRefresh);
}

export function onAuthStateChangedListener(
  callback: (user: AuthUser | null) => void,
) {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? mapFirebaseUserToAuthUser(user) : null);
  });
}
