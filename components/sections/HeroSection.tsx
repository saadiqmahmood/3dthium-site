import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const heroImages = [
  {
    src: 'https://gekjrxtrsqdbnijfznlj.supabase.co/storage/v1/object/public/site-images/home/u3225296642_3d_printed_vase_--raw_--stylize_0_--v_7_b82ce27c-fee7-419d-9a50-91d0f4be5884_2.png',
    alt: '3D Printed Vase',
  },
  {
    src: 'https://gekjrxtrsqdbnijfznlj.supabase.co/storage/v1/object/public/site-images/home/u3225296642_3d_printed_personalised_items_with_fair_backgroun_f5c59af4-982a-4e01-b99d-89b7175a8801_1.png',
    alt: 'Personalised Items',
  },
  {
    src: 'https://gekjrxtrsqdbnijfznlj.supabase.co/storage/v1/object/public/site-images/home/u3225296642_3d_printed_kitchen_accessory_with_fair_background_774bb751-a681-448b-83d4-3de334225044_1.png',
    alt: 'Kitchen Items',
  },
  {
    src: 'https://gekjrxtrsqdbnijfznlj.supabase.co/storage/v1/object/public/site-images/home/u3225296642_3d_printed_key_holder_items_with_fair_background__71bad850-a132-46e1-9735-51ce5fa3c0b9_0.png',
    alt: 'Key Holders',
  },
]

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setIsVisible(true)

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_110%)] opacity-40" />

      {/* Accent Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text Content */}
          <div
            className={`text-center lg:text-left space-y-8 flex-1 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="space-y-6">
              <h1
                className="text-5xl md:text-7xl lg:text-8xl font-light text-zinc-900 leading-tight tracking-tight"
                style={{
                  transform: `translateY(${scrollY * 0.1}px)`,
                }}
              >
                Precision 3D<br />
                <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Printing
                </span>
              </h1>

              <p
                className="text-lg md:text-xl lg:text-2xl text-zinc-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light"
                style={{
                  transform: `translateY(${scrollY * 0.05}px)`,
                }}
              >
                Transform your ideas into reality with cutting-edge additive manufacturing.
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start"
              style={{
                transform: `translateY(${scrollY * 0.03}px)`,
              }}
            >
              <Link
                href="/products"
                className="group relative bg-zinc-900 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-zinc-800 transition-all duration-300"
              >
                Explore Products
              </Link>

              <Link
                href="/custom-order"
                className="group relative border border-gray-300 text-zinc-900 px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
              >
                Custom Order
              </Link>
            </div>

          </div>

          {/* Image Gallery */}
          <div
            className={`w-full lg:w-1/2 flex justify-center transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
          >
            <div
              className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]"
              style={{
                transform: `translateY(${scrollY * -0.1}px) rotateY(${scrollY * 0.01}deg)`,
              }}
            >
              {/* Grid Container */}
              <div className="grid grid-cols-6 grid-rows-2 gap-3 w-full h-full">
                {/* Top row: two equal images */}
                <div className="relative col-span-3 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-gray-100 backdrop-blur-sm border border-gray-200 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[0].src}
                    alt={heroImages[0].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 250px"
                    priority
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                </div>

                <div className="relative col-span-3 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-gray-100 backdrop-blur-sm border border-gray-200 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[1].src}
                    alt={heroImages[1].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 250px"
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                </div>

                {/* Bottom row: kitchen (slimmer), key holder (wider) */}
                <div className="relative col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-gray-100 backdrop-blur-sm border border-gray-200 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[2].src}
                    alt={heroImages[2].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 33vw, 167px"
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                </div>

                <div className="relative col-span-4 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-gray-100 backdrop-blur-sm border border-gray-200 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[3].src}
                    alt={heroImages[3].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 67vw, 333px"
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-zinc-600 animate-bounce">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm font-light tracking-wider uppercase">Scroll</span>
          <div className="w-5 h-8 border border-gray-300 rounded-full flex justify-center">
            <div className="w-0.5 h-2 bg-zinc-600 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
