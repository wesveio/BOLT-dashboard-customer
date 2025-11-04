import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Netlify compatibility - moved to experimental for Next.js 14
  experimental: {
    serverComponentsExternalPackages: ['@netlify/plugin-nextjs'],
  },
};

export default withNextIntl(nextConfig);

