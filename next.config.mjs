/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    'passkey-kit',
    'passkey-factory-sdk',
    'passkey-kit-sdk',
    'sac-sdk',
  ],
}

export default nextConfig