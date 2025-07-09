import Link from 'next/link'

export default function Footer() {
    return (
      <footer className="bg-gray-100 p-4 text-center text-sm text-gray-500 flex flex-col items-center gap-1">
        <span>&copy; {new Date().getFullYear()} 3Dthium. All rights reserved.</span>
        <Link href="/privacy" className="hover:underline text-blue-600 mt-1">Privacy Policy</Link>
      </footer>
    )
  }

  