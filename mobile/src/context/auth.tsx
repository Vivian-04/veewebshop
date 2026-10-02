import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api, setAuthToken, type User } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { deleteItem, getItem, setItem } from "@/lib/storage";

const TOKEN_KEY = "shopwithvee.token";

type AuthContextValue = {
  user: User | null;
  /** False until the saved sign-in (if any) has been checked on launch. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  /** Resolves false if the person cancelled. */
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Re-read the profile (e.g. after checkout saved new delivery details). */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the saved sign-in on launch.
  useEffect(() => {
    (async () => {
      const token = await getItem(TOKEN_KEY).catch(() => null);
      setAuthToken(token); // also unblocks requests waiting for the saved sign-in (even when there's none)
      if (token) {
        try {
          setUser((await api<{ user: User }>("/api/me")).user);
        } catch (err) {
          // Expired or revoked token: forget it. Keep it on network errors so offline launches stay signed in.
          if (err instanceof ApiError && err.status === 401) {
            setAuthToken(null);
            await deleteItem(TOKEN_KEY);
          }
        }
      }
      setReady(true);
    })();
  }, []);

  const finishSignIn = useCallback(async ({ token, user }: { token: string; user: User }) => {
    await setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) =>
      finishSignIn(await api("/api/mobile/signin", { method: "POST", body: { email, password } })),
    [finishSignIn],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) =>
      finishSignIn(await api("/api/mobile/signup", { method: "POST", body: { name, email, password } })),
    [finishSignIn],
  );

  /** Sign in with the website's Google login (see lib/mobile-oauth.ts on the server). Resolves false if cancelled. */
  const signInWithGoogle = useCallback(async () => {
    const verifier = Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, "0")).join("");
    const challenge = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier);
    const redirect = Linking.createURL("google-auth");
    // Built by hand: React Native's URLSearchParams is only partially implemented.
    const start = `${API_URL}/api/mobile/google/start?redirect=${encodeURIComponent(redirect)}&challenge=${challenge}`;

    // An ephemeral session keeps this sign-in separate from Safari's cookies.
    const result = await WebBrowser.openAuthSessionAsync(start, redirect, { preferEphemeralSession: true });
    if (result.type !== "success") return false;

    const { code, error } = Linking.parse(result.url).queryParams ?? {};
    if (error === "cancelled" || error === "access_denied") return false;
    if (typeof code !== "string") throw new Error("Google sign-in didn't complete. Please try again.");
    await finishSignIn(await api("/api/mobile/google/exchange", { method: "POST", body: { code, verifier } }));
    return true;
  }, [finishSignIn]);

  const signOut = useCallback(async () => {
    try {
      await api("/api/mobile/signout", { method: "POST" });
    } catch {}
    setAuthToken(null);
    await deleteItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUser((await api<{ user: User }>("/api/me")).user);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signInWithGoogle, signOut, refreshUser }),
    [user, ready, signIn, signUp, signInWithGoogle, signOut, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
