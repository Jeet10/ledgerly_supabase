import './globals.css'

export const metadata = {
  title: 'Ledgerly',
  description: 'Cash ledger for customers and payments, built with Next.js and Supabase.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
