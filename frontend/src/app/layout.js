import './globals.css'

export const metadata = {
  title: 'GrowwHigh — Cashflow that climbs',
  description: 'GrowwHigh helps organizations track cash movement, balances, and member activity.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
