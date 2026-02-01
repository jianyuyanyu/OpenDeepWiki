import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// 在构建时加载环境变量（优先级：.env.local > .env）
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// 获取环境变量，构建时会被"烘焙"进去
const apiUrl = process.env.API_PROXY_URL || 'http://localhost:5265';

console.log('[Next.js Build] API_PROXY_URL:', apiUrl);

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
