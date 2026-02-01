import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import dotenv from 'dotenv';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// 手动加载环境变量
dotenv.config({ path: '.env.local' });

const apiUrl = process.env.API_PROXY_URL || 'http://localhost:5265';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
