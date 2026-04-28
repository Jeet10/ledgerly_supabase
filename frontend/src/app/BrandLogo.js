'use client'

export default function BrandLogo({ compact = false, className = '' }) {
  return (
    <div className={`brand-logo ${compact ? 'compact' : ''} ${className}`.trim()}>
      <span className="brand-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" role="img" focusable="false">
          <defs>
            <linearGradient id="growhigh-sky" x1="18" y1="16" x2="78" y2="78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="55%" stopColor="#2457d6" />
              <stop offset="100%" stopColor="#102a63" />
            </linearGradient>
            <linearGradient id="growhigh-leaf" x1="28" y1="24" x2="60" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="84" height="84" rx="28" fill="url(#growhigh-sky)" />
          <path
            d="M26 63c0-3.314 2.686-6 6-6h6v-9c0-3.314 2.686-6 6-6h2v-11c0-2.21 1.79-4 4-4s4 1.79 4 4v20.18l8.397-8.398c1.563-1.562 4.095-1.562 5.658 0 1.562 1.563 1.562 4.095 0 5.658L55.314 61H64c3.314 0 6 2.686 6 6s-2.686 6-6 6H32c-3.314 0-6-2.686-6-6Z"
            fill="rgba(255,255,255,0.18)"
          />
          <path
            d="M47 25c11.028 0 20 8.972 20 20 0 1.66-1.34 3-3 3s-3-1.34-3-3c0-7.72-6.28-14-14-14-1.66 0-3-1.34-3-3s1.34-3 3-3Z"
            fill="rgba(255,255,255,0.55)"
          />
          <path
            d="M48 70c-2.21 0-4-1.79-4-4V36c0-2.21 1.79-4 4-4s4 1.79 4 4v30c0 2.21-1.79 4-4 4Z"
            fill="#f8fafc"
          />
          <path
            d="M48 37c0-9.774 7.386-17.181 18.34-18.39.944-.104 1.612.93 1.132 1.749C63.177 27.68 56.09 33.4 48 37Z"
            fill="url(#growhigh-leaf)"
          />
          <path
            d="M48 44c-8.091-3.6-15.177-9.32-19.472-16.641-.48-.819.188-1.853 1.132-1.749C40.614 26.819 48 34.226 48 44Z"
            fill="#86efac"
          />
          <path
            d="M29 67.5c0-1.933 1.567-3.5 3.5-3.5H39v7h-6.5c-1.933 0-3.5-1.567-3.5-3.5Zm14 0c0-1.933 1.567-3.5 3.5-3.5H53v7h-6.5c-1.933 0-3.5-1.567-3.5-3.5Zm14 0c0-1.933 1.567-3.5 3.5-3.5H67v7h-6.5c-1.933 0-3.5-1.567-3.5-3.5Z"
            fill="#f8fafc"
          />
        </svg>
      </span>
      <span className="brand-logo-copy">
        <span className="brand-logo-name">GrowwHigh</span>
        {!compact && <span className="brand-logo-tagline">Cashflow that climbs with your business</span>}
      </span>
    </div>
  )
}
