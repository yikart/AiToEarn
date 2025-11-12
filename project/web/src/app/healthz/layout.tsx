export const metadata = {
  title: 'AiToEarn',
  description: 'AiToEarn',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
