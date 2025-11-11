FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@8.8.0 --activate
RUN pnpm install
COPY . .
EXPOSE 20002
CMD ["pnpm", "dev"]
