
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
RUN corepack enable && corepack prepare pnpm@8.8.0 --activate
COPY . .
RUN pnpm -w install --frozen-lockfile && pnpm --filter backend build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
RUN corepack enable && corepack prepare pnpm@8.8.0 --activate
RUN pnpm install --prod
EXPOSE 3001
CMD ["node","dist/main.js"] 
