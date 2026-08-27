/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: isProd ? '/agendamento-cepr' : '',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'qtrypzzcjebvfcihiynt.supabase.co',
      }
    ]
  }
};

module.exports = nextConfig;
