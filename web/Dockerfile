# 依赖安装阶段
FROM node:20-alpine AS deps
WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app

# 构建时环境变量 - 从 .env 文件或 ARG 获取
ARG API_PROXY_URL=http://opendeepwiki:8080
ENV API_PROXY_URL=$API_PROXY_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 创建 .env 文件用于构建时加载
RUN echo "API_PROXY_URL=${API_PROXY_URL}" > .env

# 启用 standalone 输出模式
RUN npm run build

# 生产运行阶段
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 .env 文件（如果存在）
COPY --chown=nextjs:nodejs .env* ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
