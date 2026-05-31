// src/lib/token.ts
const TOKEN_KEY = "eis_token";
const SESSION_KEY = "eis_active_session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function saveActiveSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_KEY, sessionId);
}

export function clearActiveSessionId(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
