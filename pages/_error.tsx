import type { NextPageContext } from 'next'

function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <p className="text-center py-20 text-red-600">
      {statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'}
    </p>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404
  return { statusCode }
}

export default ErrorPage
