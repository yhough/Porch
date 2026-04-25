"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  coral:  "#E8513A",
  yellow: "#F5C842",
  sage:   "#4CAF82",
  sky:    "#5BA4CF",
  navy:   "#1B2A4A",
  bg:     "#FFFDF9",
};

// ─── Content data ──────────────────────────────────────────────────────────────
const ISSUES = [
  { id: "education",      label: "Education",            icon: "🎓" },
  { id: "economics",      label: "Economics & Jobs",      icon: "💰" },
  { id: "social_justice", label: "Social Justice",        icon: "⚖️" },
  { id: "environment",    label: "Environment",           icon: "🌱" },
  { id: "housing",        label: "Housing",               icon: "🏠" },
  { id: "public_safety",  label: "Public Safety",         icon: "🚔" },
  { id: "healthcare",     label: "Healthcare",            icon: "🏥" },
  { id: "transportation", label: "Transportation",        icon: "🚇" },
  { id: "voting_rights",  label: "Voting Rights",         icon: "🗳️" },
  { id: "small_business", label: "Small Business",        icon: "💼" },
  { id: "immigration",    label: "Immigration",           icon: "🌍" },
  { id: "gun_policy",     label: "Gun Policy",            icon: "🔒" },
];

const PARTIES = [
  { id: "democratic",   label: "Democratic",       color: C.sky },
  { id: "republican",   label: "Republican",       color: C.coral },
  { id: "independent",  label: "Independent",      color: C.sage },
  { id: "green",        label: "Green",            color: "#2E7D52" },
  { id: "libertarian",  label: "Libertarian",      color: C.yellow },
  { id: "other",        label: "Other",            color: "#9B59B6" },
  { id: "none",         label: "Prefer not to say", color: "#9CA3AF" },
];

const GENDERS = ["Man", "Woman", "Non-binary", "Prefer not to say"];

const ETHNICITIES = [
  "White",
  "Black / African American",
  "Hispanic / Latino",
  "Asian / Pacific Islander",
  "Native American",
  "Middle Eastern",
  "Mixed / Multiracial",
  "Prefer not to say",
];

// ─── Step animation variants ───────────────────────────────────────────────────
const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
};
const stepTransition = { type: "spring" as const, stiffness: 340, damping: 34 };

// ─── Small reusable components ─────────────────────────────────────────────────
function Chip({
  label, icon, selected, onClick, color = C.coral,
}: {
  label: string; icon?: string; selected: boolean;
  onClick: () => void; color?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border-2"
      style={{
        backgroundColor: selected ? color + "18" : "white",
        borderColor:     selected ? color : "#E5E7EB",
        color:           selected ? color : "#6B7280",
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </motion.button>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === current ? 24 : 8, opacity: i <= current ? 1 : 0.28 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="h-2 rounded-full"
          style={{ backgroundColor: i <= current ? C.coral : "#E5E7EB" }}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step,      setStep]      = useState(0);
  const [dir,       setDir]       = useState(1);
  const [saving,    setSaving]    = useState(false);
  const [checking,  setChecking]  = useState(true);

  // Form state
  const [address,   setAddress]   = useState("");
  const [age,       setAge]       = useState("");
  const [gender,    setGender]    = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [issues,    setIssues]    = useState<string[]>([]);
  const [party,     setParty]     = useState("");

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [status, router]);

  // Skip onboarding if already completed
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.onboarding?.completedAt) router.replace("/");
      })
      .finally(() => setChecking(false));
  }, [status, router]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleIssue = (id: string) =>
    setIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleFinish = async () => {
    setSaving(true);
    await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, age, gender, ethnicity, issues, party }),
    });
    go(5);
    setSaving(false);
  };

  if (status === "loading" || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: "#E5E7EB", borderTopColor: C.coral }} />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Top bar */}
      <div className="px-6 pt-8 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{ backgroundColor: C.coral }}>
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M5 16L18 5l13 11v16H5V16z" fill="white" opacity="0.95" />
              <rect x="13" y="22" width="10" height="10" rx="2" fill={C.coral} />
            </svg>
          </div>
          <span className="text-sm font-extrabold" style={{ color: C.navy }}>Porch</span>
        </div>
        {step > 0 && step < 5 && (
          <button
            className="text-sm font-semibold"
            style={{ color: "#9CA3AF" }}
            onClick={() => handleFinish()}
          >
            Skip setup
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="px-6 pt-6">
        {step > 0 && step < 5 && <ProgressDots current={step - 1} total={4} />}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
          >

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <div className="text-center max-w-sm mx-auto">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className="text-7xl mb-6"
                >
                  👋
                </motion.div>
                <h1 className="text-3xl font-extrabold mb-3 leading-tight" style={{ color: C.navy }}>
                  Hey {firstName}, welcome to Porch!
                </h1>
                <p className="text-base font-medium mb-10 leading-relaxed" style={{ color: "#6B7280" }}>
                  Let&apos;s take 2 minutes to set up your neighborhood profile so Porch can show you
                  what matters most to you.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => go(1)}
                  className="w-full py-4 rounded-full font-bold text-white text-[16px]"
                  style={{ backgroundColor: C.coral, boxShadow: "0 4px 20px rgba(232,81,58,0.35)" }}
                >
                  Let&apos;s go →
                </motion.button>
              </div>
            )}

            {/* ── Step 1: Address ── */}
            {step === 1 && (
              <div className="max-w-sm mx-auto">
                <div className="text-4xl mb-4">📍</div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.navy }}>
                  Where do you live?
                </h2>
                <p className="text-sm font-medium mb-8" style={{ color: "#9CA3AF" }}>
                  We use this to show your local officials, ward, and nearby resources.
                </p>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 301 W Court St, Ithaca, NY 14850"
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-[16px] text-base outline-none border-2 transition-colors duration-150 resize-none"
                  style={{ borderColor: "#E5E7EB", backgroundColor: "white", color: C.navy }}
                  onFocus={(e) => (e.target.style.borderColor = C.coral)}
                  onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
                />
                <StepNav
                  onBack={() => go(0)}
                  onNext={() => go(2)}
                  nextLabel="Next →"
                />
              </div>
            )}

            {/* ── Step 2: About you ── */}
            {step === 2 && (
              <div className="max-w-sm mx-auto">
                <div className="text-4xl mb-4">🧑‍🤝‍🧑</div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.navy }}>
                  A little about you
                </h2>
                <p className="text-sm font-medium mb-7" style={{ color: "#9CA3AF" }}>
                  Optional — helps us surface community info that&apos;s relevant to you.
                </p>

                {/* Age */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2" style={{ color: C.navy }}>
                    Age
                  </label>
                  <input
                    type="number"
                    min="13"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full px-4 py-3.5 rounded-[14px] text-base outline-none border-2 transition-colors duration-150"
                    style={{ borderColor: "#E5E7EB", backgroundColor: "white", color: C.navy }}
                    onFocus={(e) => (e.target.style.borderColor = C.coral)}
                    onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>

                {/* Gender */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-3" style={{ color: C.navy }}>
                    Gender
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map((g) => (
                      <Chip
                        key={g}
                        label={g}
                        selected={gender === g}
                        onClick={() => setGender(gender === g ? "" : g)}
                      />
                    ))}
                  </div>
                </div>

                {/* Ethnicity */}
                <div className="mb-8">
                  <label className="block text-sm font-bold mb-3" style={{ color: C.navy }}>
                    Ethnicity
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ETHNICITIES.map((e) => (
                      <Chip
                        key={e}
                        label={e}
                        selected={ethnicity === e}
                        onClick={() => setEthnicity(ethnicity === e ? "" : e)}
                      />
                    ))}
                  </div>
                </div>

                <StepNav onBack={() => go(1)} onNext={() => go(3)} nextLabel="Next →" />
              </div>
            )}

            {/* ── Step 3: Issues ── */}
            {step === 3 && (
              <div className="max-w-sm mx-auto">
                <div className="text-4xl mb-4">💡</div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.navy }}>
                  What issues matter most to you?
                </h2>
                <p className="text-sm font-medium mb-7" style={{ color: "#9CA3AF" }}>
                  Pick as many as you like. We&apos;ll surface relevant local news and decisions.
                </p>
                <div className="flex flex-wrap gap-2.5 mb-8">
                  {ISSUES.map((issue) => (
                    <Chip
                      key={issue.id}
                      label={issue.label}
                      icon={issue.icon}
                      selected={issues.includes(issue.id)}
                      onClick={() => toggleIssue(issue.id)}
                    />
                  ))}
                </div>
                <StepNav onBack={() => go(2)} onNext={() => go(4)} nextLabel="Next →" />
              </div>
            )}

            {/* ── Step 4: Party ── */}
            {step === 4 && (
              <div className="max-w-sm mx-auto">
                <div className="text-4xl mb-4">🗳️</div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.navy }}>
                  Do you align with a party?
                </h2>
                <p className="text-sm font-medium mb-7" style={{ color: "#9CA3AF" }}>
                  Totally optional — no judgment either way.
                </p>
                <div className="flex flex-col gap-3 mb-8">
                  {PARTIES.map((p) => {
                    const selected = party === p.id;
                    return (
                      <motion.button
                        key={p.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setParty(selected ? "" : p.id)}
                        className="flex items-center gap-3 px-5 py-4 rounded-[16px] text-left font-bold border-2 transition-all"
                        style={{
                          backgroundColor: selected ? p.color + "14" : "white",
                          borderColor:     selected ? p.color : "#E5E7EB",
                          color:           selected ? p.color : C.navy,
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          style={{
                            borderColor:     selected ? p.color : "#D1D5DB",
                            backgroundColor: selected ? p.color : "transparent",
                          }}
                        >
                          {selected && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <circle cx="4" cy="4" r="3" fill="white" />
                            </svg>
                          )}
                        </span>
                        {p.label}
                      </motion.button>
                    );
                  })}
                </div>
                <StepNav
                  onBack={() => go(3)}
                  onNext={handleFinish}
                  nextLabel={saving ? "Saving…" : "Finish →"}
                  nextLoading={saving}
                />
              </div>
            )}

            {/* ── Step 5: Done ── */}
            {step === 5 && (
              <div className="text-center max-w-sm mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" as const, stiffness: 260, damping: 16, delay: 0.1 }}
                  className="text-7xl mb-6"
                >
                  🎉
                </motion.div>
                <h2 className="text-3xl font-extrabold mb-3" style={{ color: C.navy }}>
                  You&apos;re all set!
                </h2>
                <p className="text-base font-medium mb-6 leading-relaxed" style={{ color: "#6B7280" }}>
                  Your neighborhood profile is ready. Porch will now show you
                  what&apos;s happening in your community — filtered for what you actually care about.
                </p>

                {/* Summary chips */}
                {issues.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mb-8">
                    {issues.slice(0, 4).map((id) => {
                      const issue = ISSUES.find((i) => i.id === id)!;
                      return (
                        <span
                          key={id}
                          className="px-3 py-1.5 rounded-full text-sm font-bold"
                          style={{ backgroundColor: C.coral + "18", color: C.coral }}
                        >
                          {issue.icon} {issue.label}
                        </span>
                      );
                    })}
                    {issues.length > 4 && (
                      <span
                        className="px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                      >
                        +{issues.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/")}
                  className="w-full py-4 rounded-full font-bold text-white text-[16px]"
                  style={{ backgroundColor: C.coral, boxShadow: "0 4px 20px rgba(232,81,58,0.35)" }}
                >
                  Explore your neighborhood →
                </motion.button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step nav (back / next) ────────────────────────────────────────────────────
function StepNav({
  onBack,
  onNext,
  nextLabel = "Next →",
  nextLoading = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 py-4 rounded-full font-bold border-2 transition-colors"
        style={{ borderColor: "#E5E7EB", color: "#6B7280", backgroundColor: "white" }}
      >
        ← Back
      </button>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        disabled={nextLoading}
        className="flex-[2] py-4 rounded-full font-bold text-white"
        style={{ backgroundColor: C.coral, boxShadow: "0 4px 16px rgba(232,81,58,0.3)" }}
      >
        {nextLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
              style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
            Saving…
          </span>
        ) : nextLabel}
      </motion.button>
    </div>
  );
}
