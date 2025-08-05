

import './globals.css'
import Link from 'next/link'

export const metadata = { title: 'Gangsta AI', description: 'Truth infrastructure' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-white text-gray-800">
        <main className="flex-1">{children}</main>

        {/* Bottom Tab Bar */}
        <nav className="flex justify-around border-t bg-white py-3 shadow-lg sticky bottom-0">
          <Link href="/" className="text-gray-500 hover:text-blue-600">🏠 Home</Link>
          <Link href="/news" className="text-gray-500 hover:text-blue-600">📰 News</Link>
          <Link href="/scan" className="text-gray-500 hover:text-blue-600">🎤 Scan</Link>
          <Link href="/scan-history" className="text-gray-500 hover:text-blue-600"> Scan History </Link>
        </nav>
      </body>
    </html>
  )
}
