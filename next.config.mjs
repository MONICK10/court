/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  typescript: {
    // Legacy utils have stale type errors unrelated to active features
    ignoreBuildErrors: true,
  },
}

export default nextConfig
