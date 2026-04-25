"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const C = {
  coral:  "#E8513A",
  yellow: "#F5C842",
  navy:   "#1B2A4A",
  bg:     "#FFFDF9",
};

export default function SignInPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setError("Incorrect email or password. Try again.");
      } else {
        setError(`Sign-in failed (${result.error}). Please try again.`);
      }
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen font-sans flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: C.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block mb-5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ outlineColor: C.coral }}
            aria-label="Porch home"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-4xl sm:text-5xl font-black tracking-tight"
              style={{ color: C.navy, letterSpacing: "-0.02em" }}
            >
              porch<span style={{ color: C.coral }}>.</span>
            </motion.div>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: C.navy }}>
            Welcome back
          </h1>
          <p className="mt-2 text-[15px] font-medium" style={{ color: "#6B7280" }}>
            Sign in to explore your neighborhood
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-bold mb-1.5"
              style={{ color: C.navy }}
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-[14px] text-base outline-none border-2 transition-colors duration-150"
              style={{ borderColor: "#E5E7EB", backgroundColor: "white", color: C.navy }}
              onFocus={(e)  => (e.target.style.borderColor = C.coral)}
              onBlur={(e)   => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div>
            <label
              className="block text-sm font-bold mb-1.5"
              style={{ color: C.navy }}
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3.5 rounded-[14px] text-base outline-none border-2 transition-colors duration-150"
              style={{ borderColor: "#E5E7EB", backgroundColor: "white", color: C.navy }}
              onFocus={(e)  => (e.target.style.borderColor = C.coral)}
              onBlur={(e)   => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-sm font-semibold"
              style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <circle cx="8" cy="8" r="7.5" stroke="#B91C1C" />
                <path d="M8 5v3.5M8 11h.01" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-white text-[15px] hover:opacity-90 active:scale-[0.98] transition-all mt-2"
            style={{
              backgroundColor: C.coral,
              boxShadow: "0 4px 16px rgba(232,81,58,0.35)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}
                />
                Signing in…
              </span>
            ) : (
              "Sign in →"
            )}
          </button>
        </form>

        {/* Link to sign-up */}
        <p className="text-center text-sm font-medium mt-6" style={{ color: "#6B7280" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-bold hover:underline"
            style={{ color: C.coral }}
          >
            Sign up
          </Link>
        </p>

        <p className="text-center text-xs font-medium mt-4" style={{ color: "#9CA3AF" }}>
          Porch — Your neighborhood has a story.
        </p>
      </motion.div>
    </div>
  );
}
