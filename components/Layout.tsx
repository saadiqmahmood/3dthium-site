import type { ReactNode } from 'react'
import Footer from './Footer'
import Navbar from './Navbar'

const SessionDebug =
  process.env.NODE_ENV !== 'production'
    ? require('./SessionDebug').default
    : () => null

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <SessionDebug />
    </div>
  )
}
