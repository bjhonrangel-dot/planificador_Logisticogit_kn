
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  experimental: {
    // This allows the Next.js dev server to accept requests from cloud workstations.
    allowedDevOrigins: ["https://*.cloudworkstations.dev", "https://*.apphosting.dev"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
