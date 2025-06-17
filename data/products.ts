export type Product = {
    id: string
    slug: string
    title: string
    category: string
    image: string
    material: string
    customizable: boolean
    price: number
  }
  
export const products: Product[] = [
{
    id: 'vase001',
    slug: 'modern-vase',
    title: 'Modern Vase',
    category: 'Home Decor',
    image: '/assets/products/vase.jpg',
    material: 'PLA',
    customizable: true,
    price: 12.99,
},
{
    id: 'eggtray001',
    slug: 'egg-tray',
    title: 'Egg Tray',
    category: 'Kitchen Accessories',
    image: '/assets/products/egg-tray.jpg',
    material: 'Eco-Plastic',
    customizable: false,
    price: 9.5,
},
{
    id: 'key001',
    slug: 'keychain',
    title: 'Name Keychain',
    category: 'Charms & Keychains',
    image: '/assets/products/keychain.jpg',
    material: 'Resin',
    customizable: true,
    price: 6.25,
},
{
    id: 'camera001',
    slug: 'gopro-mount',
    title: 'GoPro Mount',
    category: 'Camera Accessories',
    image: '/assets/products/gopro.jpg',
    material: 'PLA',
    customizable: false,
    price: 14.75,
},
]
  