import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Footer from './Footer'
import Navbar from './Navbar'

const SessionDebug =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('./SessionDebug'))
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
