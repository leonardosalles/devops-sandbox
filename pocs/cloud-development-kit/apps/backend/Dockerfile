FROM --platform=linux/arm64 node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/main.js"]
