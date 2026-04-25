// Illustrated circular avatars for each representative
interface AvatarProps { size?: number; className?: string }

export function AvatarNikki({ size = 80, className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="#E8513A" />
      <circle cx="40" cy="44" r="26" fill="#F5B895" />
      {/* Dark hair, bun */}
      <path d="M14 36 Q18 12 40 12 Q62 12 66 36 Q58 18 40 16 Q22 18 14 36Z" fill="#1A0A00" />
      <circle cx="40" cy="12" r="9" fill="#1A0A00" />
      <circle cx="50" cy="6" r="5" fill="#1A0A00" />
      {/* Ears */}
      <ellipse cx="14" cy="44" rx="5" ry="7" fill="#F5B895" />
      <ellipse cx="66" cy="44" rx="5" ry="7" fill="#F5B895" />
      {/* Eyes */}
      <circle cx="32" cy="42" r="5" fill="white" />
      <circle cx="32" cy="43" r="3" fill="#1A0A00" />
      <circle cx="33" cy="41" r="1" fill="white" />
      <circle cx="48" cy="42" r="5" fill="white" />
      <circle cx="48" cy="43" r="3" fill="#1A0A00" />
      <circle cx="49" cy="41" r="1" fill="white" />
      {/* Smile */}
      <path d="M32 54 Q40 61 48 54" stroke="#1A0A00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <circle cx="24" cy="50" r="6" fill="#E07050" opacity="0.2" />
      <circle cx="56" cy="50" r="6" fill="#E07050" opacity="0.2" />
    </svg>
  );
}

export function AvatarMia({ size = 80, className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="#4CAF82" />
      <circle cx="40" cy="44" r="26" fill="#DBA57A" />
      {/* Straight dark hair */}
      <path d="M14 36 Q18 12 40 12 Q62 12 66 36 Q58 16 40 14 Q22 16 14 36Z" fill="#0D0700" />
      {/* Side hair */}
      <rect x="13" y="32" width="8" height="22" rx="4" fill="#0D0700" />
      <rect x="59" y="32" width="8" height="22" rx="4" fill="#0D0700" />
      <ellipse cx="14" cy="44" rx="5" ry="7" fill="#DBA57A" />
      <ellipse cx="66" cy="44" rx="5" ry="7" fill="#DBA57A" />
      <circle cx="32" cy="42" r="5" fill="white" />
      <circle cx="32" cy="43" r="3" fill="#0D0700" />
      <circle cx="33" cy="41" r="1" fill="white" />
      <circle cx="48" cy="42" r="5" fill="white" />
      <circle cx="48" cy="43" r="3" fill="#0D0700" />
      <circle cx="49" cy="41" r="1" fill="white" />
      {/* Glasses */}
      <rect x="24" y="38" width="14" height="10" rx="5" stroke="#2D1B0E" strokeWidth="2" fill="none" />
      <rect x="42" y="38" width="14" height="10" rx="5" stroke="#2D1B0E" strokeWidth="2" fill="none" />
      <line x1="38" y1="43" x2="42" y2="43" stroke="#2D1B0E" strokeWidth="2" />
      <path d="M32 54 Q40 62 48 54" stroke="#0D0700" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="50" r="6" fill="#E07050" opacity="0.2" />
      <circle cx="56" cy="50" r="6" fill="#E07050" opacity="0.2" />
    </svg>
  );
}

export function AvatarBarbara({ size = 80, className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="#5BA4CF" />
      <circle cx="40" cy="44" r="26" fill="#C8845A" />
      {/* Short silver/gray hair */}
      <path d="M14 38 Q16 14 40 14 Q64 14 66 38 Q58 20 40 18 Q22 20 14 38Z" fill="#9AA0A8" />
      <ellipse cx="40" cy="16" rx="22" ry="8" fill="#9AA0A8" />
      <ellipse cx="14" cy="44" rx="5" ry="7" fill="#C8845A" />
      <ellipse cx="66" cy="44" rx="5" ry="7" fill="#C8845A" />
      <circle cx="32" cy="42" r="5" fill="white" />
      <circle cx="32" cy="43" r="3" fill="#2D1B0E" />
      <circle cx="33" cy="41" r="1" fill="white" />
      <circle cx="48" cy="42" r="5" fill="white" />
      <circle cx="48" cy="43" r="3" fill="#2D1B0E" />
      <circle cx="49" cy="41" r="1" fill="white" />
      {/* Wise smile with laugh lines */}
      <path d="M32 55 Q40 63 48 55" stroke="#2D1B0E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M25 50 Q22 54 25 58" stroke="#C8845A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M55 50 Q58 54 55 58" stroke="#C8845A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <circle cx="24" cy="52" r="6" fill="#E07050" opacity="0.2" />
      <circle cx="56" cy="52" r="6" fill="#E07050" opacity="0.2" />
    </svg>
  );
}

export function AvatarLayla({ size = 80, className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="#F5C842" />
      <circle cx="40" cy="44" r="26" fill="#E0A870" />
      {/* Dark wavy hair, longer */}
      <path d="M14 36 Q18 10 40 10 Q62 10 66 36 Q58 14 40 12 Q22 14 14 36Z" fill="#150A00" />
      <path d="M13 36 Q10 52 14 62" stroke="#150A00" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M67 36 Q70 52 66 62" stroke="#150A00" strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="14" cy="44" rx="5" ry="7" fill="#E0A870" />
      <ellipse cx="66" cy="44" rx="5" ry="7" fill="#E0A870" />
      <circle cx="32" cy="42" r="5" fill="white" />
      <circle cx="32" cy="43" r="3" fill="#150A00" />
      <circle cx="33" cy="41" r="1" fill="white" />
      <circle cx="48" cy="42" r="5" fill="white" />
      <circle cx="48" cy="43" r="3" fill="#150A00" />
      <circle cx="49" cy="41" r="1" fill="white" />
      <path d="M32 54 Q40 62 48 54" stroke="#150A00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="50" r="6" fill="#E07050" opacity="0.2" />
      <circle cx="56" cy="50" r="6" fill="#E07050" opacity="0.2" />
    </svg>
  );
}
