import fs from "fs";
import path from "path";

// On Vercel (read-only filesystem) fall back to /tmp which is writable.
// /tmp is ephemeral per-container but sufficient for demo/auth flow.
const DEFAULT_FILE = path.join(process.cwd(), "data", "users.json");
const TMP_FILE = "/tmp/porch-users.json";

function getUsersFile(): string {
  try {
    fs.accessSync(path.dirname(DEFAULT_FILE), fs.constants.W_OK);
    return DEFAULT_FILE;
  } catch {
    return TMP_FILE;
  }
}

export interface OnboardingData {
  completedAt: string;
  address: string;
  age: number | null;
  gender: string;
  ethnicity: string;
  income: string;
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
  // Always read from both locations and merge so users created in /tmp
  // are visible alongside any seed users bundled in data/users.json.
  const readFile = (p: string): StoredUser[] => {
    try {
      if (!fs.existsSync(p)) return [];
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch {
      return [];
    }
  };

  const file = getUsersFile();
  if (file === DEFAULT_FILE) return readFile(DEFAULT_FILE);

  // On Vercel: merge seed users from the bundled file with runtime users in /tmp
  const seed = readFile(DEFAULT_FILE);
  const tmp  = readFile(TMP_FILE);
  // tmp users take precedence (they may have onboarding updates)
  const merged = [...seed];
  for (const u of tmp) {
    if (!merged.find((s) => s.email === u.email)) merged.push(u);
    else {
      const idx = merged.findIndex((s) => s.email === u.email);
      merged[idx] = u;
    }
  }
  return merged;
}

function writeUsers(users: StoredUser[]): void {
  const file = getUsersFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(users, null, 2));
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
