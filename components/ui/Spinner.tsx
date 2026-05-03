interface SpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Spinner({ label, size = 'md' }: SpinnerProps) {
  const dims = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`animate-spin rounded-full ${dims} border-b-2 border-emerald-600`} />
      {label && <span className="ml-3 text-zinc-600 font-light">{label}</span>}
    </div>
  )
}
