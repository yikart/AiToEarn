'use client'

import Link from 'next/link'
import { useGetClientLng } from '@/hooks/useSystem'

export default function NotFound() {
  const lng = useGetClientLng()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <span style={{ fontSize: '60px', color: 'var(--theColor5)' }}>404</span>
      <Link
        href={`/${lng}`}
        style={{
          marginTop: '20px',
          color: 'var(--theColor5)',
          textDecoration: 'none',
          padding: '8px 16px',
          border: '1px solid var(--theColor5)',
          borderRadius: '8px',
          transition: 'all 0.3s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--theColor5)'
          e.currentTarget.style.color = 'white'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--theColor5)'
        }}
      >
        Back to Home
      </Link>
    </div>
  )
}
