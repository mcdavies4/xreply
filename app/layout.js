import './globals.css'

export const metadata = {
  title: 'X Reply Assistant — RightPDFKit',
  description: 'Find and reply to relevant tweets about building products',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
