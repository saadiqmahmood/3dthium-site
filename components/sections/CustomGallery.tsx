import React from 'react'
import Image from 'next/image'

type GalleryItem = {
  id: number
  title: string
  image: string
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: 'Custom Nameplate',
    image: '/assets/custom-gallery/nameplate.jpg',
  },
  {
    id: 2,
    title: 'Camera Mount',
    image: '/assets/custom-gallery/camera-mount.jpg',
  },
  {
    id: 3,
    title: 'Figurine Shelf',
    image: '/assets/custom-gallery/shelf.jpg',
  },
  {
    id: 4,
    title: 'Phone Holder',
    image: '/assets/custom-gallery/phone-holder.jpg',
  },
]

export default function CustomGallery() {
  return (
    <section className="mt-16 py-20">
      <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-20">
        Previous Custom Work
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow hover:shadow-md transition"
          >
            <div className="w-full h-56 bg-gray-100 rounded-t-xl overflow-hidden">
              <Image
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                width={300}
                height={300}
              />
            </div>
            <div className="p-4">
              <h3 className="text-md font-semibold text-gray-700">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
