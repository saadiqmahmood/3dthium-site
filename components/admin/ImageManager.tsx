import { useRef } from 'react'

interface ImageManagerProps {
  galleryImages: File[]
  onGalleryChange: (images: File[]) => void
  maxGalleryImages?: number
}

export default function ImageManager({
  galleryImages,
  onGalleryChange,
  maxGalleryImages = 9
}: ImageManagerProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null)

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
        const x = (size - img.width) / 2
        const y = (size - img.height) / 2
        
        // Draw the image centered
        ctx.drawImage(img, x, y, img.width, img.height)
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, { type: 'image/jpeg' })
            resolve(croppedFile)
          } else {
            reject(new Error('Could not create blob'))
          }
        }, 'image/jpeg', 0.9)
      }
      
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleGalleryUpload = async (files: FileList) => {
    if (files.length === 0) return
    
    const newFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      if (galleryImages.length + newFiles.length >= maxGalleryImages) break
      
      const file = files[i]
      if (file.type.startsWith('image/')) {
        try {
          // Automatically crop to square
          const squareFile = await createSquareImage(file)
          newFiles.push(squareFile)
        } catch (error) {
          console.error('Error cropping image:', error)
          // Fallback to original file if cropping fails
          newFiles.push(file)
        }
      }
    }
    
    if (newFiles.length > 0) {
      onGalleryChange([...galleryImages, ...newFiles])
    }
  }

  const removeGalleryImage = (index: number) => {
    const newGallery = galleryImages.filter((_, i) => i !== index)
    onGalleryChange(newGallery)
  }

  const reorderGalleryImages = (fromIndex: number, toIndex: number) => {
    const newGallery = [...galleryImages]
    const [movedImage] = newGallery.splice(fromIndex, 1)
    newGallery.splice(toIndex, 0, movedImage)
    onGalleryChange(newGallery)
  }


  return (
    <div className="space-y-6">
      {/* Gallery Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Gallery Images ({galleryImages.length}/{maxGalleryImages})
        </h3>
        
        {/* Gallery Upload */}
        <div className="mb-4">
          <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <input
              ref={galleryInputRef}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)}
            />
            Add Gallery Images
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Images will be uploaded when you create the product
          </p>
        </div>

        {/* Gallery Images Display */}
        {galleryImages.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {galleryImages.length} images selected
            </p>
            
            <div className="flex flex-wrap gap-4">
              {galleryImages.map((file, index) => (
                <div key={`gallery-${file.name}-${index}`} className="space-y-2">
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Gallery ${index + 1}`}
                      className="object-cover rounded border"
                      style={{ 
                        width: '128px', 
                        height: '128px',
                        aspectRatio: '1/1'
                      }}
                      onError={(e) => {
                        console.error('Gallery image error:', file.name, e)
                        e.currentTarget.style.display = 'none'
                      }}
                      onLoad={() => {
                        console.log('Gallery image loaded successfully:', file.name)
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 w-32">
                    <div className="font-medium truncate" title={file.name}>{file.name}</div>
                    <div>{(file.size / 1024 / 1024).toFixed(1)}MB</div>
                  </div>
                  
                  {/* Action buttons below image */}
                  <div className="flex gap-1 justify-center">
                    {index > 0 && (
                      <button
                        onClick={() => reorderGalleryImages(index, index - 1)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    {index < galleryImages.length - 1 && (
                      <button
                        onClick={() => reorderGalleryImages(index, index + 1)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                    <button
                      onClick={() => removeGalleryImage(index)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-500 mt-4">
          <p>• Images are stored locally until you create the product</p>
          <p>• Use crop tool to adjust image positioning</p>
          <p>• Drag images to reorder them</p>
          <p>• Maximum {maxGalleryImages} gallery images</p>
        </div>
      </div>


    </div>
  )
} 