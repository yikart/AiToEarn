import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
      exclude: path.resolve(__dirname, 'src/assets/svgs/plat'),
    })

    config.module.rules.push({
      test: /\.svg$/,
      include: path.resolve(__dirname, 'src/assets/svgs/plat'),
      type: 'asset/resource',
    })

    return config
  },
  reactStrictMode: false,
  experimental: {
    forceSwcTransforms: true,
    outputFileTracingRoot: undefined,
  },
  output: 'standalone', // Temporarily disabled to avoid symlink issues on Windows
  productionBrowserSourceMaps: process.env.NEXT_PUBLIC_EVN === 'dev',
  rewrites: async () => {
    const rewrites = [
      {
        source: `${process.env.NEXT_PUBLIC_OSS_URL_PROXY}:path*`,
        destination: `${process.env.NEXT_PUBLIC_OSS_URL}/:path*`,
      },
    ]

    // 存在 NEXT_PUBLIC_PROXY_URL 则代理，本地直连 用
    // 如：NEXT_PUBLIC_PROXY_URL = http://localhost:8080
    if (process.env.NEXT_PUBLIC_PROXY_URL) {
      rewrites.push({
        source: `/api/:path*`,
        destination: `${process.env.NEXT_PUBLIC_PROXY_URL}/api/:path*`,
      })
    }
    return rewrites
  },
}

const CorsHeaders = [
  { key: 'Access-Control-Allow-Credentials', value: 'true' },
  { key: 'Access-Control-Allow-Origin', value: '*' },
  {
    key: 'Access-Control-Allow-Methods',
    value: '*',
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: '*',
  },
  {
    key: 'Access-Control-Max-Age',
    value: '86400',
  },
]

nextConfig.headers = async () => {
  return [
    {
      source: '/api/:path*',
      headers: CorsHeaders,
    },
  ]
}

export default nextConfig
