import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    return cred;
  }

  async function signup(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    return cred;
  }

  async function logout() {
    setToken(null);
    return signOut(auth);
  }

  async function refreshToken() {
    if (currentUser) {
      const idToken = await currentUser.getIdToken(true);
      setToken(idToken);
      return idToken;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, token, login, signup, logout, refreshToken, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
