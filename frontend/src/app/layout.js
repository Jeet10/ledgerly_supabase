import './globals.css'

export const metadata = {
  title: 'GrowwHigh',
  description: 'GrowwHigh helps organizations track cash movement, balances, and member activity.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
