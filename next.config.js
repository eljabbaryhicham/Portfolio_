/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'export',
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
       {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'files.catbox.moe',
      },
      {
        protocol: 'https',
        hostname: 'portfolio-hicham-ten.vercel.app',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2,
  }
};

module.exports = nextConfig;
