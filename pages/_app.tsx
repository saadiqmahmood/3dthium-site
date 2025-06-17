import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Schibsted_Grotesk } from 'next/font/google'
import Layout from '@/components/Layout'
import { CartProvider } from '@/context/CartContext'


const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${schibsted.variable} font-sans`}>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </CartProvider>
    </div>
  )
}
