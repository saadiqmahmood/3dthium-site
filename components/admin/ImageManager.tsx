import { useRef, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useSupabase } from '@/context/SupabaseContext'

interface ImageManagerProps {
  categorySlug: string
  productSlug: string
  galleryImages: string[] // Now expects URLs, not File objects
  onGalleryChange: (images: string[]) => void
  maxGalleryImages?: number
}

export default function ImageManager({
  categorySlug,
  productSlug,
  galleryImages,
  onGalleryChange,
  maxGalleryImages = 9,
}: ImageManagerProps) {
  const supabaseContext = useSupabase()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  if (!supabaseContext) {
    return <div className="text-red-500 p-4">Error: Supabase client not available</div>
  }
  const { client: supabase } = supabaseContext

  /**
   * Creates a square-cropped version of an image
   * Centers the image and crops to the smallest dimension
   */
  const createSquareImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Determine the size of the square (use the smaller dimension)
        const size = Math.min(img.width, img.height)

        // Set canvas to square dimensions
        canvas.width = size
        canvas.height = size

        // Calculate position to center the image
        const sourceX = (img.width - size) / 2
        const sourceY = (img.height - size) / 2

        // Draw the image centered and cropped
        ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, size, size)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name, { type: 'image/jpeg' })
              resolve(croppedFile)
            } else {
              reject(new Error('Could not create blob'))
            }
          },
          'image/jpeg',
          0.9
        )
      }

      img.onerror = () => reject(new Error('Could not load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Uploads a single file to Supabase Storage
   * Returns the public URL of the uploaded file
   */
  const uploadImageToSupabase = async (file: File, index: number): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${index}.${fileExt}`
    const filePath = `${categorySlug}/${productSlug}/gallery/${fileName}`

    console.log('📤 Uploading to Supabase:', filePath)

    const { data, error } = await supabase.storage.from('products').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      console.error('❌ Upload failed:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('✅ Upload successful:', data.path)

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('products').getPublicUrl(filePath)

    return publicUrl
  }

  /**
   * Handles gallery image upload
   * 1. Auto-crops images to square
   * 2. Uploads to Supabase Storage
   * 3. Returns URLs to parent component
   */
  const handleGalleryUpload = async (files: FileList) => {
    if (files.length === 0) return

    const remainingSlots = maxGalleryImages - galleryImages.length
    if (remainingSlots <= 0) {
      setToast({ message: `Maximum ${maxGalleryImages} images allowed`, type: 'error' })
      return
    }

    setUploading(true)
    setUploadProgress(`Processing 0/${files.length} images...`)

    try {
      const newUrls: string[] = []
      const filesToUpload = Math.min(files.length, remainingSlots)

      for (let i = 0; i < filesToUpload; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`)
          continue
        }

        setUploadProgress(`Processing ${i + 1}/${filesToUpload} images...`)

        try {
          // Step 1: Auto-crop to square
          console.log(`🔄 Cropping image ${i + 1}:`, file.name)
          const squareFile = await createSquareImage(file)

          // Step 2: Upload to Supabase
          console.log(`📤 Uploading image ${i + 1}:`, file.name)
          const url = await uploadImageToSupabase(squareFile, i)

          newUrls.push(url)
          console.log(`✅ Image ${i + 1} complete:`, url)
        } catch (error) {
          console.error(`Error processing image ${file.name}:`, error)
          setToast({ message: `Failed to upload ${file.name}: ${error}`, type: 'error' })
          // Continue with other images
        }
      }

      if (newUrls.length > 0) {
        // Add new URLs to existing gallery
        onGalleryChange([...galleryImages, ...newUrls])
        console.log(`✅ Successfully uploaded ${newUrls.length} images`)
      }
    } catch (error) {
      console.error('Gallery upload error:', error)
      setToast({ message: `Upload failed: ${error}`, type: 'error' })
    } finally {
      setUploading(false)
      setUploadProgress('')

      // Reset file input
      if (galleryInputRef.current) {
        galleryInputRef.current.value = ''
      }
    }
  }

  /**
   * Removes an image from the gallery
   */
  const removeGalleryImage = (index: number) => {
    const newGallery = galleryImages.filter((_, i) => i !== index)
    onGalleryChange(newGallery)
  }

  /**
   * Reorders images in the gallery
   */
  const reorderGalleryImages = (fromIndex: number, toIndex: number) => {
    const newGallery = [...galleryImages]
    const [movedImage] = newGallery.splice(fromIndex, 1)
    newGallery.splice(toIndex, 0, movedImage)
    onGalleryChange(newGallery)
  }

  return (
    <div className="space-y-6">
      {/* Gallery Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-light text-zinc-900">
            Product Images ({galleryImages.length}/{maxGalleryImages})
          </h3>
          {galleryImages.length > 0 && (
            <p className="text-sm text-zinc-600 font-light">First image will be the thumbnail</p>
          )}
        </div>

        {/* Upload Button */}
        <div className="mb-4">
          <label
            className={`cursor-pointer inline-block px-4 py-2 rounded-lg transition-colors font-light ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <input
              ref={galleryInputRef}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)}
              disabled={uploading || galleryImages.length >= maxGalleryImages}
            />
            {uploading ? uploadProgress : 'Upload Images'}
          </label>
          <p className="text-sm text-zinc-500 mt-2 font-light">
            • Images will be automatically cropped to square
            <br />• Maximum {maxGalleryImages} images
            <br />• Recommended: 800x800px or larger
            <br />• Supported formats: JPG, PNG, WebP
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
              <span className="text-sm text-emerald-700 font-light">{uploadProgress}</span>
            </div>
          </div>
        )}

        {/* Gallery Images Display */}
        {galleryImages.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {galleryImages.map((imageUrl, index) => (
                <div key={imageUrl} className="space-y-2">
                  {/* Image Preview */}
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Gallery ${index + 1}`}
                      className="object-cover rounded-lg border-2 border-gray-200"
                      style={{
                        width: '128px',
                        height: '128px',
                        aspectRatio: '1/1',
                      }}
                      onError={(e) => {
                        console.error('Gallery image load error:', imageUrl)
                        e.currentTarget.style.display = 'none'
                      }}
                      onLoad={() => {
                        console.log(`✅ Image ${index + 1} loaded:`, imageUrl.substring(0, 50))
                      }}
                    />
                    {/* Thumbnail Badge */}
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded font-light">
                        Thumbnail
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="text-xs text-zinc-600 w-32">
                    <div className="font-light truncate" title={imageUrl}>
                      Image {index + 1}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 justify-center flex-wrap">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => reorderGalleryImages(index, index - 1)}
                        className="bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs hover:bg-emerald-700 transition-colors font-light"
                        title="Move left"
                      >
                        ← Move
                      </button>
                    )}
                    {index < galleryImages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => reorderGalleryImages(index, index + 1)}
                        className="bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs hover:bg-emerald-700 transition-colors font-light"
                        title="Move right"
                      >
                        Move →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs hover:bg-red-700 transition-colors font-light"
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg
              aria-hidden="true"
              focusable="false"
              className="mx-auto h-12 w-12 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-zinc-600 font-light">No images uploaded yet</p>
            <p className="text-xs text-zinc-500 font-light">
              Click &quot;Upload Images&quot; to add product photos
            </p>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
