import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Important for monorepo packages and React Native libraries
  transpilePackages: [
    '@repo/ui',
    '@repo/ai-components',
    '@repo/supabase',
    'react-native-safe-area-context',
  ],

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Map React Native imports to React Native Web
      'react-native$': 'react-native-web',
      // Force safe-area-context to its web-friendly entry
      'react-native-safe-area-context$': path.resolve(
        __dirname,
        'node_modules/react-native-safe-area-context/lib/module/index.js'
      ),
    }

    // ✅ Prefer .web.tsx / .web.ts on web to avoid native parsing errors
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.tsx',
      '.ts',
      '.web.js',
      '.js',
      ...config.resolve.extensions!,
    ]

    return config
  },

  async rewrites() {
    return [
      {
        // 1. When the browser requests this source path (which your frontend code uses)
        source: '/api/:path*', 
        // 2. Rewrite/Proxy the request to your FastAPI backend server
        destination: 'http://localhost:3002/:path*', 
      },
    ]
  },
}

export default nextConfig
