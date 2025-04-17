// lib/firebaseAdmin.ts
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
    Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 as string,
      "base64"
    ).toString("utf8")
  );
  

let app: App | undefined; // app will never be undefined because of getApps()[0]
if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app!);
export const db = getFirestore();