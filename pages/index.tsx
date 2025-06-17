import Head from "next/head";
import HeroSection from '@/components/sections/HeroSection'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import CustomPrintsCTA from "@/components/sections/CustomPrintsCTA";

export default function Home() {
  return (
    <section className="p-8">
      <Head>
        <title>3Dthium – Custom 3D Prints</title>
      </Head>
      <div className="text-center space-y-4">
        <HeroSection />
        <FeaturedProducts />
        <CustomPrintsCTA/>
      </div>
    </section>
  )
}