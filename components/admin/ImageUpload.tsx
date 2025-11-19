import { createClient } from '@supabase/supabase-js'
import { useCallback, useState } from 'react'

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uploadImage = async (file: File): Promise<string> => {
    // Validate inputs
    if (!categorySlug || !productSlug) {
      throw new Error('Category and product slug are required for upload')
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
  }

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`)
          continue
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB`)
          continue
        }

        const imageUrl = await uploadImage(file)
        newImages.push(imageUrl)
      }

      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesChange(updatedImages)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images'
      alert(`Upload Error: ${errorMessage}\n\nPlease check:\n- You have a valid product slug\n- You are logged in as an admin\n- Storage bucket exists and has correct permissions`)
    } finally {
      setUploading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, maxImages, onImagesChange])

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

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files)
      }
    },
    [handleFileUpload]
  )

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
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span>{' '}
              or drag and drop
            </label>
            <input
              id="file-upload"
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-2">
                    {index > 0 && (
                      <button
                        onClick={() => reorderImages(index, index - 1)}
                        className="bg-white text-gray-800 p-1 rounded-full hover:bg-gray-100"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        onClick={() => reorderImages(index, index + 1)}
                        className="bg-white text-gray-800 p-1 rounded-full hover:bg-gray-100"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            First image will be used as the main thumbnail. Drag images to reorder.
          </p>
        </div>
      )}
    </div>
  )
}
