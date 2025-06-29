export type Product = {
    id: string
    slug: string
    title: string
    description: string
    category: string
    thumbnail_url: string
}

export type ProductVariant = {
    id: string
    product_id: string
    color: string
    image_url: string
    price: number
    in_stock: boolean
    customizable: boolean
} 