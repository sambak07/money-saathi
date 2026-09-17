import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  title: 'Money Saathi — Your money, simply',
  description: 'A Bhutan-first personal money companion for tracking spending, planning monthly finances and saving towards your goals.',
  openGraph: {
    title: 'Money Saathi — Your money, simply',
    description: 'A Bhutan-first personal money companion for tracking spending, planning monthly finances and saving towards your goals.',
    type: 'website',
  },
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/mobile-polish.css" />
        {children}
      </body>
    </html>
  )
}
