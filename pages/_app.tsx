import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Schibsted_Grotesk } from 'next/font/google'
import Layout from '@/components/Layout'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { createBrowserClient } from '@supabase/ssr'
import { SupabaseContextProvider } from '@/context/SupabaseContext'

const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${schibsted.variable} font-sans`}>
      <SupabaseContextProvider client={supabaseClient}>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </CartProvider>
        </AuthProvider>
      </SupabaseContextProvider>

    </div>
  )
}
