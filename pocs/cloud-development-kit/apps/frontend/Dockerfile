
# Frontend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
RUN corepack enable && corepack prepare pnpm@8.8.0 --activate
COPY . .
RUN pnpm -w install --frozen-lockfile && pnpm --filter frontend build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/package.json ./package.json
RUN corepack enable && corepack prepare pnpm@8.8.0 --activate
RUN pnpm install --prod
EXPOSE 3000
CMD ["pnpm","start"]
