// src/hooks/useFirebaseUser.ts
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "~/lib/firebaseConfigs/firebaseConfig";

export default function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return user;
}
