import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Netlify compatibility
  serverComponentsExternalPackages: ['@netlify/plugin-nextjs'],
};

export default withNextIntl(nextConfig);

