import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

export interface OnboardingData {
  completedAt: string;
  address: string;
  age: number | null;
  gender: string;
  ethnicity: string;
  issues: string[];
  party: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  onboarding?: OnboardingData;
}

function readUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): StoredUser | null {
  return readUsers().find((u) => u.email === email.toLowerCase()) ?? null;
}

export function findUserById(id: string): StoredUser | null {
  return readUsers().find((u) => u.id === id) ?? null;
}

export function createUser(name: string, email: string, passwordHash: string): StoredUser {
  const users = readUsers();
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export function updateUserOnboarding(
  id: string,
  data: Omit<OnboardingData, "completedAt">
): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx].onboarding = { ...data, completedAt: new Date().toISOString() };
  writeUsers(users);
}
