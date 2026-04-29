const ThemeIcon = ({ theme }) =>
  theme === 'dark' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm0 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Zm8.25-4.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5ZM6.75 12a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1 0-1.5H6a.75.75 0 0 1 .75.75Zm10.553 5.053a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 1 1-1.06-1.06l1.06-1.061ZM7.758 7.758a.75.75 0 0 1 0 1.06L6.697 9.879a.75.75 0 0 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Zm10.605 2.121a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.061l1.06 1.06a.75.75 0 0 1 0 1.061ZM7.758 16.242a.75.75 0 0 1-1.06 0l-1.061-1.06a.75.75 0 0 1 1.06-1.061l1.06 1.06a.75.75 0 0 1 0 1.061ZM12 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 18Z"
        fill="currentColor"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.53 3.53a.75.75 0 0 1 .83.97A8.25 8.25 0 1 0 19.5 14.64a.75.75 0 0 1 .97.83A9.75 9.75 0 1 1 14.53 3.53Z"
        fill="currentColor"
      />
    </svg>
  )

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-brand-toggle"
      type="button"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-brand-icon">
        <ThemeIcon theme={theme} />
      </span>
      <span className="theme-brand-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
