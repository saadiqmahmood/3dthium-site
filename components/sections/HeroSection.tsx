import Link from 'next/link'
import React from 'react'
import Image from 'next/image'

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
  return (
    <section className="bg-gray-50 py-16 px-6 rounded-xl pb-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left space-y-10 flex-1">
          <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-4">
            Showcase Your 3D Designs
          </h1>
          <p className="text-gray-700 text-lg mb-6">
            Creative 3D printed products for your home, gifts, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/products"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-500 transition"
            >
              Explore Products
            </Link>
            <Link
              href="/custom-order"
              className="border border-blue-500 text-blue-500 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Custom Order
            </Link>
          </div>
        </div>

        {/* Custom 2x2 Image Grid with variable widths on bottom row */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div
            className="grid grid-cols-6 grid-rows-2 gap-4 w-[320px] h-[320px] md:w-[400px] md:h-[400px]"
            style={{ gridTemplateRows: '1fr 1fr', gridTemplateColumns: 'repeat(6, 1fr)' }}
          >
            {/* Top row: two equal images */}
            <div className="relative col-span-3 row-span-1 rounded-xl overflow-hidden shadow-md bg-white">
              <Image
                src={heroImages[0].src}
                alt={heroImages[0].alt}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 50vw, 200px"
                priority
              />
            </div>
            <div className="relative col-span-3 row-span-1 rounded-xl overflow-hidden shadow-md bg-white">
              <Image
                src={heroImages[1].src}
                alt={heroImages[1].alt}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 50vw, 200px"
              />
            </div>
            {/* Bottom row: kitchen (slimmer), key holder (wider) */}
            <div className="relative col-span-2 row-span-1 rounded-xl overflow-hidden shadow-md bg-white">
              <Image
                src={heroImages[2].src}
                alt={heroImages[2].alt}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 33vw, 133px"
              />
            </div>
            <div className="relative col-span-4 row-span-1 rounded-xl overflow-hidden shadow-md bg-white">
              <Image
                src={heroImages[3].src}
                alt={heroImages[3].alt}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 67vw, 267px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}