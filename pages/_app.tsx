import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Schibsted_Grotesk } from 'next/font/google'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/AdminLayout'
import Layout from '@/components/Layout'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { FavouritesProvider } from '@/context/FavouritesContext'
import { SupabaseContextProvider } from '@/context/SupabaseContext'
import { supabase } from '@/lib/supabaseClient'

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isAdmin = router.pathname.startsWith('/admin')

  const content = isAdmin ? (
    <AdminLayout>
      <Component {...pageProps} />
    </AdminLayout>
  ) : (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )

  return (
    <div className={`${schibsted.variable} font-sans`}>
      <SupabaseContextProvider client={supabase}>
        <AuthProvider>
          <FavouritesProvider>
            <CartProvider>{content}</CartProvider>
          </FavouritesProvider>
        </AuthProvider>
      </SupabaseContextProvider>
    </div>
  )
}
