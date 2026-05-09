'use client'

export default function BrandLogo({ compact = false, className = '' }) {
  return (
    <div className={`brand-logo ${compact ? 'compact' : ''} ${className}`.trim()}>
      <span className="brand-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" role="img" focusable="false">
          <defs>
            <linearGradient id="gh-bg" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--logo-grad-start, #6366f1)" />
              <stop offset="55%" stopColor="var(--logo-grad-mid, #8b5cf6)" />
              <stop offset="100%" stopColor="var(--logo-grad-end, #06b6d4)" />
            </linearGradient>
            <linearGradient id="gh-bar" x1="0" y1="80" x2="0" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,1)" />
            </linearGradient>
            <linearGradient id="gh-spark" x1="20" y1="60" x2="78" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
            <radialGradient id="gh-glow" cx="0.7" cy="0.25" r="0.85">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <rect x="4" y="4" width="88" height="88" rx="26" fill="url(#gh-bg)" />
          <rect x="4" y="4" width="88" height="88" rx="26" fill="url(#gh-glow)" />
          <rect x="4" y="4" width="88" height="88" rx="26" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <g>
            <rect x="22" y="58" width="10" height="20" rx="3" fill="url(#gh-bar)" opacity="0.85" />
            <rect x="38" y="46" width="10" height="32" rx="3" fill="url(#gh-bar)" opacity="0.92" />
            <rect x="54" y="34" width="10" height="44" rx="3" fill="url(#gh-bar)" />
          </g>
          <path
            d="M22 56 L40 42 L54 50 L72 28"
            fill="none"
            stroke="url(#gh-spark)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M64 26 L74 24 L72 34 Z"
            fill="url(#gh-spark)"
            stroke="url(#gh-spark)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="56" r="2.6" fill="#fef9c3" />
          <circle cx="40" cy="42" r="2.6" fill="#fef9c3" />
          <circle cx="54" cy="50" r="2.6" fill="#fef9c3" />
        </svg>
      </span>
      <span className="brand-logo-copy">
        <span className="brand-logo-name">GrowwHigh</span>
        {!compact && <span className="brand-logo-tagline">Cashflow that climbs with your business</span>}
      </span>
    </div>
  )
}
