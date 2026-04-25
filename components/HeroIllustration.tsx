export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ground shadow */}
      <ellipse cx="130" cy="308" rx="75" ry="14" fill="rgba(0,0,0,0.12)" />

      {/* Shoes */}
      <ellipse cx="98" cy="298" rx="24" ry="11" fill="#1B2A4A" />
      <ellipse cx="158" cy="298" rx="24" ry="11" fill="#2D3A5A" />

      {/* Legs */}
      <rect x="80" y="238" width="36" height="65" rx="18" fill="#2D3A5A" />
      <rect x="140" y="238" width="36" height="65" rx="18" fill="#1B2A4A" />

      {/* Body - coral top */}
      <rect x="62" y="152" width="136" height="100" rx="32" fill="#E8513A" />

      {/* Collar / neck */}
      <rect x="108" y="138" width="44" height="30" rx="14" fill="#F5B895" />

      {/* Left arm — down, holds phone */}
      <path
        d="M74 178 Q44 200 48 232"
        stroke="#F5B895"
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
      />
      {/* Phone */}
      <rect x="30" y="222" width="36" height="58" rx="8" fill="#1B2A4A" />
      <rect x="34" y="228" width="28" height="44" rx="5" fill="#5BA4CF" />
      {/* Screen content lines */}
      <rect x="37" y="232" width="14" height="3" rx="1.5" fill="white" opacity="0.6" />
      <rect x="37" y="238" width="20" height="3" rx="1.5" fill="white" opacity="0.4" />
      <rect x="37" y="244" width="17" height="3" rx="1.5" fill="white" opacity="0.4" />
      <circle cx="48" cy="264" r="4" fill="#2D3A5A" />

      {/* Right arm — raised and waving */}
      <path
        d="M186 172 Q214 148 210 112"
        stroke="#F5B895"
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
      />
      {/* Waving hand palm */}
      <ellipse cx="212" cy="100" rx="20" ry="22" fill="#F5B895" />
      {/* Fingers */}
      <rect x="197" y="74" width="10" height="22" rx="5" fill="#F5B895" />
      <rect x="210" y="70" width="10" height="26" rx="5" fill="#F5B895" />
      <rect x="222" y="74" width="10" height="22" rx="5" fill="#F5B895" />
      <rect x="230" y="82" width="9" height="18" rx="4.5" fill="#F5B895" />

      {/* Head */}
      <circle cx="130" cy="108" r="60" fill="#F5B895" />

      {/* Hair — dark, rounded top */}
      <path
        d="M70 98 Q76 44 130 44 Q184 44 190 98 Q176 68 130 64 Q84 68 70 98Z"
        fill="#2D1B0E"
      />
      {/* Hair side bits */}
      <ellipse cx="72" cy="108" rx="9" ry="14" fill="#2D1B0E" />
      <ellipse cx="188" cy="108" rx="9" ry="14" fill="#2D1B0E" />

      {/* Ears */}
      <ellipse cx="70" cy="112" rx="9" ry="12" fill="#F5B895" />
      <ellipse cx="190" cy="112" rx="9" ry="12" fill="#F5B895" />

      {/* Left eye */}
      <circle cx="108" cy="112" r="13" fill="white" />
      <circle cx="109" cy="114" r="8" fill="#2D1B0E" />
      <circle cx="112" cy="110" r="3" fill="white" />
      {/* Right eye */}
      <circle cx="152" cy="112" r="13" fill="white" />
      <circle cx="153" cy="114" r="8" fill="#2D1B0E" />
      <circle cx="156" cy="110" r="3" fill="white" />

      {/* Eyebrows */}
      <path
        d="M98 96 Q108 90 118 96"
        stroke="#2D1B0E"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M142 96 Q152 90 162 96"
        stroke="#2D1B0E"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Smile */}
      <path
        d="M111 134 Q130 150 149 134"
        stroke="#2D1B0E"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Teeth */}
      <path
        d="M111 134 Q130 144 149 134 Q130 152 111 134Z"
        fill="white"
      />

      {/* Rosy cheeks */}
      <circle cx="94" cy="128" r="14" fill="#E07050" opacity="0.25" />
      <circle cx="166" cy="128" r="14" fill="#E07050" opacity="0.25" />

      {/* Stars / sparkles around character */}
      <path
        d="M32 80 L34 74 L36 80 L42 82 L36 84 L34 90 L32 84 L26 82 Z"
        fill="#F5C842"
        opacity="0.9"
      />
      <path
        d="M220 60 L222 55 L224 60 L229 62 L224 64 L222 69 L220 64 L215 62 Z"
        fill="#F5C842"
        opacity="0.7"
      />
      <circle cx="42" cy="54" r="4" fill="#4CAF82" opacity="0.8" />
      <circle cx="220" cy="38" r="3" fill="#5BA4CF" opacity="0.8" />
      <circle cx="18" cy="140" r="5" fill="#E8513A" opacity="0.5" />
    </svg>
  );
}
