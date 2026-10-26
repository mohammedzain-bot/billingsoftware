/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double invocation in dev for clean POS and charts
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
