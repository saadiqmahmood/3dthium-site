import { useEffect } from 'react'

type Props = {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type = 'success', onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 md:right-6 md:bottom-20 md:left-auto left-1/2 transform -translate-x-1/2 md:translate-x-0 
      px-4 py-2 shadow-md text-sm md:text-base z-50 transition-opacity duration-300 rounded-md
      ${type === 'success' ? 'bg-white text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}
    >
      {message}
    </div>
  )
}
