import { APP_BRAND } from '@/config/brand'

export const metadata = {
  title: APP_BRAND.name,
  description: APP_BRAND.name,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
