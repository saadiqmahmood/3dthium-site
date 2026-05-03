import { useCallback, useEffect, useId, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import Toast from '@/components/ui/Toast'

interface ImageUploadProps {
  categorySlug: string
  productSlug: string
  onImagesChange: (images: string[]) => void
  initialImages?: string[]
  maxImages?: number
}

export default function ImageUpload({
  categorySlug,
  productSlug,
  onImagesChange,
  initialImages = [],
  maxImages = 10,
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileUploadId = useId()

  const supabaseContext = useSupabase()
  const supabase = supabaseContext?.client

  // Reset images when initialImages changes (new option selected)
  // Note: productSlug is part of the key, so component remounts when it changes
  useEffect(() => {
    setImages(initialImages)
  }, [initialImages])

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      // Validate inputs
      if (!categorySlug || !productSlug) {
        throw new Error('Category and product slug are required for upload')
      }

      if (!supabase) {
        throw new Error('Supabase client not available. Please refresh the page.')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${categorySlug}/${productSlug}/${fileName}`

      const { error } = await supabase.storage.from('products').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        console.error('Supabase upload error:', error)
        // Provide more helpful error messages
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          throw new Error('A file with this name already exists. Please rename your file.')
        } else if (error.message.includes('not found') || error.message.includes('bucket')) {
          throw new Error('Storage bucket not found. Please contact support.')
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          throw new Error('Permission denied. You may not have upload access.')
        } else {
          throw new Error(`Upload failed: ${error.message}`)
        }
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('products').getPublicUrl(filePath)

      return publicUrl
    },
    [categorySlug, productSlug, supabase]
  )

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (images.length + files.length > maxImages) {
        setToast({ message: `Maximum ${maxImages} images allowed`, type: 'error' })
        return
      }

      setUploading(true)
      const newImages: string[] = []

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          // Validate file type
          if (!file.type.startsWith('image/')) {
            setToast({ message: `${file.name} is not an image file`, type: 'error' })
            continue
          }

          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            setToast({ message: `${file.name} is too large. Maximum size is 5MB`, type: 'error' })
            continue
          }

          const imageUrl = await uploadImage(file)
          newImages.push(imageUrl)
        }

        const updatedImages = [...images, ...newImages]
        setImages(updatedImages)
        console.log(
          `📤 ImageUpload: Uploading to productSlug: ${productSlug}, ${updatedImages.length} total images`
        )
        onImagesChange(updatedImages)
      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload images'
        setToast({ message: `Upload error: ${errorMessage}`, type: 'error' })
      } finally {
        setUploading(false)
      }
    },
    [images, maxImages, onImagesChange, uploadImage, productSlug]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer?.files?.[0]) {
        handleFileUpload(e.dataTransfer.files)
      }
    },
    [handleFileUpload]
  )

  if (!supabaseContext) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-red-800">
        <p>Error: Supabase client not available. Please refresh the page.</p>
      </div>
    )
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images]
    const [movedImage] = updatedImages.splice(fromIndex, 1)
    updatedImages.splice(toIndex, 0, movedImage)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop requires div element */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
            role="img"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600">
            <label htmlFor={fileUploadId} className="cursor-pointer">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span>{' '}
              or drag and drop
            </label>
            <input
              id={fileUploadId}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF up to 5MB each. Max {maxImages} images.
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Uploading images...</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Product Images ({images.length}/{maxImages})
          </h3>
          <div className="flex flex-wrap gap-4">
            {images.map((image) => (
              <div key={`${productSlug}-${image}`} className="space-y-2">
                {/* Image Preview */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`Product for ${productSlug}`}
                    className="object-cover rounded border-2 border-gray-300"
                    style={{
                      width: '128px',
                      height: '128px',
                      aspectRatio: '1/1',
                    }}
                    onError={(e) => {
                      console.error('Image load error:', image)
                      e.currentTarget.style.display = 'none'
                    }}
                    onLoad={() => {
                      console.log(`✅ Image loaded:`, image.substring(0, 50))
                    }}
                  />
                  {/* Main Badge */}
                  {images.indexOf(image) === 0 && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                </div>
                {/* Action Buttons */}
                <div className="flex gap-1 justify-center flex-wrap">
                  {images.indexOf(image) > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        reorderImages(images.indexOf(image), images.indexOf(image) - 1)
                      }
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition"
                      title="Move left"
                    >
                      ← Move
                    </button>
                  )}
                  {images.indexOf(image) < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        reorderImages(images.indexOf(image), images.indexOf(image) + 1)
                      }
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition"
                      title="Move right"
                    >
                      Move →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(images.indexOf(image))}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
                    title="Remove image"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            First image will be used as the main thumbnail. Drag images to reorder.
          </p>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
