interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="text-center py-16">
      <p className="text-red-600 font-light">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-light text-zinc-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
