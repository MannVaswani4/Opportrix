import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Opportrix — The Unified Feed for Your Freelance Career',
  description:
    'Aggregate freelance opportunities from LinkedIn, Twitter, and Reddit into one powerful dashboard. Auto-comment, check your ATS score, and connect with top recruiters.',
  keywords: 'freelance, jobs, hiring, ATS score, LinkedIn, Twitter, Reddit, remote work',
  openGraph: {
    title: 'Opportrix',
    description: 'The unified feed for your freelance career.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
