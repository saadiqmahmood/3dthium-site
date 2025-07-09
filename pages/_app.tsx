import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Schibsted_Grotesk } from 'next/font/google'
import Layout from '@/components/Layout'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { SupabaseContextProvider } from '@/context/SupabaseContext'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/AdminLayout'

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');

  const content = isAdmin ? (
    <AdminLayout>
      <Component {...pageProps} />
    </AdminLayout>
  ) : (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );

  return (
    <div className={`${schibsted.variable} font-sans`}>
      <SupabaseContextProvider client={supabase}>
        <AuthProvider>
          <CartProvider>
            {content}
          </CartProvider>
        </AuthProvider>
      </SupabaseContextProvider>
    </div>
  );
}
