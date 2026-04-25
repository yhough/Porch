import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/users";

/**
 * NextAuth requires a secret to sign JWTs and session cookies.
 * Production (e.g. Vercel) must set NEXTAUTH_SECRET or AUTH_SECRET or you get NO_SECRET / 500 on /api/auth/*.
 */
const authSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "dev-only-nextauth-secret-min-32-characters-long"
    : undefined);

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = findUserByEmail(credentials.email);
        if (user) {
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, name: user.name, email: user.email };
        }

        // Fallback env-var demo account
        if (
          credentials.email === process.env.AUTH_EMAIL &&
          credentials.password === process.env.AUTH_PASSWORD
        ) {
          return { id: "admin", name: "Admin", email: process.env.AUTH_EMAIL! };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
};
