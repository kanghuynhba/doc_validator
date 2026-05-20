import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AppFrame } from '@/components/app-frame'
import './globals.css'

export const metadata: Metadata = {
  title: 'Document Intelligence Studio',
  description:
    'Upload PDFs, generate concise summaries, take adaptive quizzes, and review model performance in a clean workspace.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased text-foreground bg-background selection:bg-primary/20 selection:text-foreground">
        <AppFrame>{children}</AppFrame>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
