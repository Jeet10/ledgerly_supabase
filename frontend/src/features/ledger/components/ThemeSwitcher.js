'use client'

import { useEffect, useRef, useState } from 'react'

export const THEMES = [
  { id: 'midnight', name: 'Midnight', mode: 'dark', swatch: ['#020617', '#6366f1', '#8b5cf6'] },
  { id: 'obsidian', name: 'Obsidian', mode: 'dark', swatch: ['#07090e', '#14b8a6', '#0ea5e9'] },
  { id: 'nebula', name: 'Nebula', mode: 'dark', swatch: ['#0c0420', '#ec4899', '#8b5cf6'] },
  { id: 'forest', name: 'Forest', mode: 'dark', swatch: ['#04140d', '#10b981', '#059669'] },
  { id: 'daylight', name: 'Daylight', mode: 'light', swatch: ['#f6f7fb', '#2457d6', '#22d3ee'] },
  { id: 'sand', name: 'Sand', mode: 'light', swatch: ['#fbf5ec', '#ea580c', '#facc15'] },
  { id: 'mint', name: 'Mint', mode: 'light', swatch: ['#f0fbf4', '#059669', '#67e8f9'] },
  { id: 'lavender', name: 'Lavender', mode: 'light', swatch: ['#f7f4fc', '#7c3aed', '#ec4899'] },
]

export const DEFAULT_THEME = 'midnight'

export function isValidTheme(id) {
  return THEMES.some(theme => theme.id === id)
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
      <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
      <line x1="5.2" y1="18.8" x2="6.9" y2="17.1" />
      <line x1="17.1" y1="6.9" x2="18.8" y2="5.2" />
    </g>
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path
      d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a.75.75 0 0 0-1-.85 10 10 0 1 0 12.85 12.85.75.75 0 0 0-.85-1Z"
      fill="currentColor"
    />
  </svg>
)

const PaletteIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4-.4-.4-.6-.9-.6-1.4 0-1.1.9-2 2-2H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3.5 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
      fill="currentColor"
    />
  </svg>
)

export default function ThemeSwitcher({ theme, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleKey = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0]
  const darkThemes = THEMES.filter(t => t.mode === 'dark')
  const lightThemes = THEMES.filter(t => t.mode === 'light')

  return (
    <div className="theme-switcher" ref={containerRef}>
      <button
        className="theme-switcher-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${activeTheme.name}. Click to change.`}
        title={`Theme: ${activeTheme.name}`}
        onClick={() => setOpen(value => !value)}
      >
        <span
          className="theme-switcher-swatch"
          style={{
            background: `linear-gradient(135deg, ${activeTheme.swatch[1]}, ${activeTheme.swatch[2]})`,
          }}
          aria-hidden="true"
        />
        <span className="theme-switcher-icon" aria-hidden="true">
          <PaletteIcon />
        </span>
      </button>

      {open && (
        <div className="theme-switcher-popover" role="dialog" aria-label="Choose theme">
          <div className="theme-switcher-section">
            <div className="theme-switcher-section-head">
              <MoonIcon />
              <span>Dark</span>
            </div>
            <div className="theme-switcher-grid">
              {darkThemes.map(themeOption => (
                <ThemeCard
                  key={themeOption.id}
                  themeOption={themeOption}
                  active={themeOption.id === theme}
                  onSelect={() => {
                    onChange(themeOption.id)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
          <div className="theme-switcher-section">
            <div className="theme-switcher-section-head">
              <SunIcon />
              <span>Light</span>
            </div>
            <div className="theme-switcher-grid">
              {lightThemes.map(themeOption => (
                <ThemeCard
                  key={themeOption.id}
                  themeOption={themeOption}
                  active={themeOption.id === theme}
                  onSelect={() => {
                    onChange(themeOption.id)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeCard({ themeOption, active, onSelect }) {
  return (
    <button
      type="button"
      className={active ? 'theme-card active' : 'theme-card'}
      onClick={onSelect}
      aria-pressed={active}
    >
      <span
        className="theme-card-preview"
        style={{
          background: `linear-gradient(135deg, ${themeOption.swatch[0]} 0%, ${themeOption.swatch[0]} 40%, ${themeOption.swatch[1]} 70%, ${themeOption.swatch[2]} 100%)`,
        }}
        aria-hidden="true"
      >
        <span className="theme-card-dot" style={{ background: themeOption.swatch[1] }} />
        <span className="theme-card-dot" style={{ background: themeOption.swatch[2] }} />
      </span>
      <span className="theme-card-name">{themeOption.name}</span>
      {active && (
        <span className="theme-card-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="12" height="12">
            <path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  )
}
