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

export default function SignUpPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign-in failed. Try signing in manually.");
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
        {/* Brand mark */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[22px] mb-5"
            style={{ backgroundColor: C.coral, boxShadow: "0 8px 28px rgba(232,81,58,0.35)" }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M5 16L18 5l13 11v16H5V16z" fill="white" opacity="0.95" />
              <rect x="13" y="22" width="10" height="10" rx="2" fill={C.coral} />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: C.navy }}>
            Create your account
          </h1>
          <p className="mt-2 text-[15px] font-medium" style={{ color: "#6B7280" }}>
            Join your neighborhood on Porch
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-bold mb-1.5"
              style={{ color: C.navy }}
              htmlFor="name"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              autoComplete="name"
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
              placeholder="Min. 8 characters"
              required
              autoComplete="new-password"
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
              htmlFor="confirm"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
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
                Creating account…
              </span>
            ) : (
              "Create account →"
            )}
          </button>
        </form>

        {/* Link to sign-in */}
        <p className="text-center text-sm font-medium mt-6" style={{ color: "#6B7280" }}>
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-bold hover:underline"
            style={{ color: C.coral }}
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs font-medium mt-4" style={{ color: "#9CA3AF" }}>
          Porch — Your neighborhood has a story.
        </p>
      </motion.div>
    </div>
  );
}
