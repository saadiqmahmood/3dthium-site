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
  const [particles, setParticles] = useState<
    Array<{ left: number; top: number; delay: number; duration: number }>
  >([])

  // Generate particles on client-side only
  useEffect(() => {
    setParticles(
      [...Array(20)].map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      }))
    )
  }, [])
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setIsVisible(true)

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          ></div>
        ))}
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
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight"
                style={{
                  transform: `translateY(${scrollY * 0.1}px)`,
                  textShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}
              >
                Showcase Your{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                  3D Designs
                </span>
              </h1>

              <p
                className="text-xl md:text-2xl lg:text-3xl text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                style={{
                  transform: `translateY(${scrollY * 0.05}px)`,
                }}
              >
                Creative 3D printed products for your home, gifts, and more.
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
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
              >
                <span className="relative z-10">Explore Products</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Link>

              <Link
                href="/custom-order"
                className="group relative border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                <span className="relative z-10">Custom Order</span>
                <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Features */}
            <div
              className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8"
              style={{
                transform: `translateY(${scrollY * 0.02}px)`,
              }}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                ✨ Customizable
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                🎨 Multiple Colors
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                📏 Various Sizes
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                🚀 Fast Delivery
              </div>
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
                <div className="relative col-span-3 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[0].src}
                    alt={heroImages[0].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 250px"
                    priority
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                <div className="relative col-span-3 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[1].src}
                    alt={heroImages[1].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 250px"
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Bottom row: kitchen (slimmer), key holder (wider) */}
                <div className="relative col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[2].src}
                    alt={heroImages[2].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 33vw, 167px"
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                <div className="relative col-span-4 row-span-1 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform duration-500">
                  <Image
                    src={heroImages[3].src}
                    alt={heroImages[3].alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 67vw, 333px"
                    className="hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
