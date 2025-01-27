
import { Inter } from 'next/font/google'
import './globals.css'

import { metadata } from './meta'

export { metadata }

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
