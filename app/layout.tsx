import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MITAOE — Attendance & Academic Intelligence',
  description:
    'Role-based attendance intelligence for MIT Academy of Engineering: live analytics, predictive trends and instant insight for students, faculty and administrators.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0d16' },
    { media: '(prefers-color-scheme: light)', color: '#f4f6fb' },
  ],
}

// Applies the stored theme before first paint so light mode never flashes dark.
const themeScript = `try{var t=localStorage.getItem('mitaoe_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}var r=document.documentElement;if(t==='light'){r.classList.add('light');r.classList.remove('dark');r.style.colorScheme='light';}}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-[#080b14]" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased text-foreground`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <div className="app-canvas" aria-hidden="true" />
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
