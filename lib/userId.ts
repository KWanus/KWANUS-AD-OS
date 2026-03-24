// Device-scoped user ID — persisted in localStorage
// Generates a UUID on first visit, reused forever on this device

const KEY = "kwanus_user_id";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
